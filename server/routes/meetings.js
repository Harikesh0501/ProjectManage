const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

// Notification helper function
async function createNotification(recipientId, type, title, message, relatedMeeting = null, relatedProject = null, createdBy = null) {
  try {
    const Notification = require('../models/Notification');
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      relatedMeeting,
      relatedProject,
      createdBy
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Create meeting (Only Mentor can create)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, zoomMeetingLink, zoomMeetingId, projectId, scheduledDate, duration } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only mentors can create meetings
    if (user.role !== 'Mentor') {
      return res.status(403).json({ message: 'Only mentors can create meetings' });
    }

    // Check if user is part of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user is mentor of the project
    if (project.mentor?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to create meeting for this project' });
    }

    // Prepare team members for invitation (Mentor invites all team members and student)
    let teamMembersToInvite = [];
    let mentorId = userId;

    // Add students to invitation list
    if (project.students && project.students.length > 0) {
      for (const studentId of project.students) {
        const student = await User.findById(studentId);
        if (student) {
          teamMembersToInvite.push({
            userId: studentId,
            name: student.name,
            email: student.email,
            status: 'invited'
          });
        }
      }
    }

    // Add team members to invitation list
    if (project.teamMembers && project.teamMembers.length > 0) {
      for (const memberId of project.teamMembers) {
        const member = await User.findById(memberId);
        if (member) {
          teamMembersToInvite.push({
            userId: memberId,
            name: member.name,
            email: member.email,
            status: 'invited'
          });
        }
      }
    }

    console.log('Team members to invite:', teamMembersToInvite);

    // Create meeting
    const meeting = new Meeting({
      title,
      description,
      zoomMeetingLink,
      zoomMeetingId,
      createdBy: userId,
      createdByRole: user.role,
      project: projectId,
      mentor: mentorId,
      teamMembers: teamMembersToInvite,
      scheduledDate,
      duration
    });

    await meeting.save();

    // Populate references
    await meeting.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'mentor', select: 'name email' },
      { path: 'project', select: 'title' }
    ]);

    // Send notifications to all invited team members
    const notificationMessage = `${user.name} has invited you to a meeting: "${title}" scheduled for ${new Date(scheduledDate).toLocaleString()}`;

    // Notify all team members
    for (const member of teamMembersToInvite) {
      if (member.userId && member.userId.toString() !== userId) {
        await createNotification(
          member.userId,
          'meeting_created',
          `New Meeting Scheduled: ${title}`,
          notificationMessage,
          meeting._id,
          projectId,
          userId
        );
      }
    }

    // Send emails to all team members (Fire and Forget)
    (async () => {
      try {
        console.log('📧 Sending meeting emails to', teamMembersToInvite.length, 'members');
        const projectData = await Project.findById(projectId);
        await Promise.allSettled(teamMembersToInvite.map(async (member) => {
          if (member.email && member.userId.toString() !== userId) {
            try {
              // Determine if this user is a student or team member to customize email if needed
              // For now using generic template
              await emailService.sendMeetingScheduledEmail(
                member.email,
                member.name,
                user.name,
                title,
                projectData.title,
                scheduledDate,
                duration,
                zoomMeetingLink
              );
            } catch (err) {
              console.error(`Failed to send email to ${member.email}:`, err.message);
            }
          }
        }));
      } catch (emailErr) {
        console.error('❌ Error in meeting email background process:', emailErr.message);
      }
    })();

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting
    });
  } catch (error) {
    console.error('Meeting creation error:', error);
    res.status(500).json({ message: 'Error creating meeting', error: error.message });
  }
});

// Get all meetings for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Smart Logic: Auto-archive past meetings
    const now = new Date();
    const initialMeetings = await Meeting.find({ project: projectId });

    // Check for meetings that should be completed
    const updates = initialMeetings.map(async (meeting) => {
      if (meeting.status === 'scheduled' || meeting.status === 'ongoing') {
        const durationMs = (meeting.duration || 60) * 60 * 1000;
        const endTime = new Date(new Date(meeting.scheduledDate).getTime() + durationMs);

        if (endTime < now) {
          meeting.status = 'completed';
          await meeting.save();
        }
      }
    });

    await Promise.all(updates);

    // Re-fetch to get sorted and populated data
    const meetings = await Meeting.find({ project: projectId })
      .populate('createdBy', 'name email')
      .populate('mentor', 'name email')
      .populate('teamMembers.userId', 'name email')
      .sort({ scheduledDate: -1 });

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Error fetching meetings', error: error.message });
  }
});

// Get all meetings for current user
router.get('/user/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      $or: [
        { createdBy: userId },
        { mentor: userId },
        { 'teamMembers.userId': userId }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('mentor', 'name email')
      .populate('project', 'title')
      .sort({ scheduledDate: -1 });

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meeting history:', error);
    res.status(500).json({ message: 'Error fetching meeting history', error: error.message });
  }
});

// Join meeting
router.post('/:meetingId/join', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is authorized to join
    const isAuthorized =
      meeting.mentor?.toString() === userId ||
      meeting.teamMembers.some(tm => tm.userId?.toString() === userId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to join this meeting' });
    }

    // Update status to joined
    const teamMemberIndex = meeting.teamMembers.findIndex(tm => tm.userId?.toString() === userId);
    if (teamMemberIndex !== -1) {
      meeting.teamMembers[teamMemberIndex].status = 'joined';
      meeting.teamMembers[teamMemberIndex].joinedAt = new Date();
    }

    // Update meeting status if all members have joined
    const allJoined = meeting.teamMembers.every(tm => tm.status === 'joined' || tm.status === 'attended');
    if (allJoined && meeting.status === 'scheduled') {
      meeting.status = 'ongoing';
    }

    await meeting.save();

    res.json({
      message: 'Joined meeting successfully',
      meeting
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ message: 'Error joining meeting', error: error.message });
  }
});

// Update meeting status
router.patch('/:meetingId/status', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status, notes, recordingLink } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only creator or mentor can update status
    if (meeting.createdBy.toString() !== userId && meeting.mentor?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update meeting' });
    }

    if (status) meeting.status = status;
    if (notes) meeting.notes = notes;
    if (recordingLink) meeting.recordingLink = recordingLink;

    await meeting.save();

    res.json({
      message: 'Meeting updated successfully',
      meeting
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ message: 'Error updating meeting', error: error.message });
  }
});

// Delete meeting (only creator)
router.delete('/:meetingId', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only creator can delete meeting' });
    }

    await Meeting.findByIdAndDelete(meetingId);

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Error deleting meeting', error: error.message });
  }
});

// Get single meeting
router.get('/:meetingId', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId)
      .populate('createdBy', 'name email')
      .populate('mentor', 'name email')
      .populate('teamMembers.userId', 'name email')
      .populate('project', 'title');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Error fetching meeting', error: error.message });
  }
});

module.exports = router;
