const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mentorOnly = require('../middleware/mentorOnly');
const zoomService = require('../services/zoomService');
const Project = require('../models/Project');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Create Zoom Meeting (Only Mentors)
router.post('/create-meeting', auth, mentorOnly, async (req, res) => {
  try {
    const { title, startTime, projectId } = req.body;
    const mentorId = req.user.id;

    console.log('🔍 Create meeting request:');
    console.log('  Title:', title);
    console.log('  StartTime:', startTime);
    console.log('  ProjectId:', projectId);
    console.log('  MentorId:', mentorId);

    // Validate input
    if (!title || !startTime || !projectId) {
      return res.status(400).json({ error: 'Title, startTime, and projectId are required' });
    }

    // Get project details
    console.log('📍 Fetching project details...');
    const project = await Project.findById(projectId)
      .populate('students', 'email name')
      .populate('teamMembers', 'email name')
      .populate('creator', 'email name');

    console.log('✓ Project found:', project?.title);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify mentor is assigned to this project (or allow if mentor is admin)
    console.log('🔐 Verifying mentor access...');
    console.log('  Project mentor:', project.mentor?.toString());
    console.log('  Current mentor:', mentorId);
    
    if (project.mentor?.toString() !== mentorId) {
      console.warn('⚠️ Mentor not authorized for this project');
      return res.status(403).json({ error: 'Not authorized to create meeting for this project' });
    }

    // Create Zoom meeting
    console.log('⚡ Creating Zoom meeting...');
    const zoomMeeting = await zoomService.createMeeting(
      mentorId,
      title,
      startTime,
      projectId
    );
    console.log('✅ Zoom meeting created:', zoomMeeting);

    // Collect all emails
    const emails = [];
    
    // Add students
    if (project.students) {
      project.students.forEach(student => {
        if (student.email) emails.push(student.email);
      });
    }

    // Add team members
    if (project.teamMembers) {
      project.teamMembers.forEach(member => {
        if (member.email) emails.push(member.email);
      });
    }

    // Add creator
    if (project.creator && project.creator.email) {
      emails.push(project.creator.email);
    }

    // Send emails with Zoom link
    if (emails.length > 0) {
      try {
        await emailService.sendMeetingLink(
          emails,
          zoomMeeting.zoomMeetingLink,
          title,
          new Date(startTime).toLocaleString(),
          projectId
        );
      } catch (emailError) {
        console.error('Failed to send emails:', emailError);
        // Continue even if emails fail
      }
    }

    res.json({
      success: true,
      data: {
        zoomMeetingLink: zoomMeeting.zoomMeetingLink,
        meetingId: zoomMeeting.meetingId,
        startTime: zoomMeeting.startTime,
        duration: zoomMeeting.duration,
        emailsSent: emails.length
      },
      message: `Meeting created! Invitation sent to ${emails.length} members`
    });
  } catch (error) {
    console.error('❌ Error creating Zoom meeting:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Full error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get Meeting Details
router.get('/meeting/:meetingId', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await zoomService.getMeetingDetails(meetingId);

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Meeting Participants
router.get('/meeting/:meetingId/participants', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const participants = await zoomService.getMeetingParticipants(meetingId);

    res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add Meeting Registrant
router.post('/meeting/:meetingId/registrant', auth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const result = await zoomService.addMeetingRegistrant(
      meetingId,
      firstName,
      lastName,
      email
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error adding registrant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Meeting
router.delete('/meeting/:meetingId', auth, mentorOnly, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const result = await zoomService.deleteMeeting(meetingId);

    res.json(result);
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
