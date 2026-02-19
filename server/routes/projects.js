const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const emailService = require('../services/emailService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = express.Router();

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching projects for user:', req.user.id, 'Role:', req.user.role);
    let query = {};
    if (req.user.role === 'Admin') {
      // Admin sees all
      console.log('Admin viewing all projects');
    } else if (req.user.role === 'Mentor') {
      // Mentors see projects they are assigned to
      query = { mentor: req.user.id };
      console.log('Mentor query:', query);
    } else if (req.user.role === 'Student') {
      // Students see projects they created or are team members of
      query = { $or: [{ creator: req.user.id }, { teamMembers: req.user.id }, { students: req.user.id }] };
      console.log('Student query:', query);
    } else {
      // Other roles or unrecognized roles see nothing
      console.warn('Unknown role requesting projects:', req.user.role);
      return res.json([]); // Return empty array instead of all projects
    }
    const projects = await Project.find(query).populate('creator students teamMembers mentor', 'name email skills collegeId bio');
    console.log('Projects found:', projects.length);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get available projects for joining (admin-created, no student)
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ msg: 'Only students can view available projects' });
    const allProjects = await Project.find({}).populate('creator');
    const projects = allProjects.filter(p => p.creator && p.creator.role === 'Admin' && p.students.length === 0);
    console.log('Available projects:', projects.length);
    res.json(projects);
  } catch (e) {
    console.log('Error in available:', e);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching project:', req.params.id);
    console.log('User:', req.user);
    const project = await Project.findById(req.params.id).populate('creator students teamMembers mentor', 'name email skills collegeId bio');
    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ msg: 'Project not found' });
    }

    console.log('Project found:', {
      id: project._id,
      creator: project.creator,
      students: project.students,
      teamMembers: project.teamMembers,
      mentor: project.mentor
    });

    // Check if user has access to this project
    const isAdmin = req.user.role === 'Admin';
    const isCreator = project.creator?._id.toString() === req.user.id;
    const isStudent = project.students.some(s => s.toString() === req.user.id);
    const isTeamMember = project.teamMembers.some(tm => tm._id.toString() === req.user.id);
    const isMentor = project.mentor?._id?.toString() === req.user.id;

    console.log('Access check:', { isAdmin, isCreator, isStudent, isTeamMember, isMentor });

    // For testing, allow access
    // if (!isAdmin && !isCreator && !isTeamMember && !isMentor) {
    //   console.log('Access denied for user:', req.user.id);
    //   return res.status(403).json({ msg: 'Access denied' });
    // }

    console.log('Access granted');
    res.json(project);
  } catch (err) {
    console.log('Error fetching project:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  const { title, description, teamMembers, mentor, startDate, endDate, githubRepo, shouldCreateGithubRepo, teamMembersGithub, teamSize } = req.body;
  console.log('Create project request:', req.body);
  try {
    let teamMemberIds = [];
    if (teamMembers && teamMembers.length > 0) {
      // teamMembers can be either strings (emails) or objects with details
      teamMemberIds = await Promise.all(teamMembers.map(async (member) => {
        let email, name, collegeId, bio, skills;

        if (typeof member === 'string') {
          // Old format: just email
          email = member;
        } else {
          // New format: object with details
          email = member.email;
          name = member.name;
          collegeId = member.collegeId;
          bio = member.bio;
          skills = member.skills;
        }

        if (!email) return null;

        // Find user
        let user = await User.findOne({ email });
        if (!user) {
          throw new Error(`User with email ${email} not found. Please ask them to register first.`);
        } else if (name || collegeId || bio || skills) {
          // Update existing user with new details if provided
          if (name) user.name = name;
          if (collegeId) user.collegeId = collegeId;
          if (bio) user.bio = bio;
          if (skills && skills.length > 0) user.skills = skills;
          await user.save();
          console.log('Updated user:', user._id);
        }

        return user._id;
      }));

      // Filter out any nulls if email was missing
      teamMemberIds = teamMemberIds.filter(id => id !== null);
      console.log('Team member ids:', teamMemberIds);
    }
    let mentorId = null;
    if (mentor) {
      mentorId = mentor; // mentor is already the _id from frontend
      console.log('Mentor id:', mentorId);
    }
    console.log('Saving project:', { title, description, creator: req.user.id, teamMembers: teamMemberIds, mentor: mentorId, startDate, endDate });
    const projectData = {
      title,
      description,
      creator: req.user.id,
      teamMembers: teamMemberIds,
      githubRepoCreatedBy: shouldCreateGithubRepo ? req.user.id : null,
      shouldCreateGithubRepo: shouldCreateGithubRepo || false,
      teamSize: teamSize || 3
    };

    // Add GitHub team members data if provided
    if (teamMembersGithub && teamMembersGithub.length > 0) {
      projectData.teamMembersGithub = teamMembersGithub.map(member => ({
        userId: member.userId,
        name: member.name,
        email: member.email,
        githubUsername: member.githubUsername,
        joinedGithub: false
      }));
    }

    if (req.user.role === 'Student') {
      projectData.students = [req.user.id];
    }
    if (mentorId && req.user.role !== 'Admin') projectData.mentor = mentorId;
    if (startDate && !isNaN(new Date(startDate).getTime())) projectData.startDate = new Date(startDate);
    if (endDate && !isNaN(new Date(endDate).getTime())) projectData.endDate = new Date(endDate);
    if (githubRepo) projectData.githubRepo = githubRepo;
    console.log('Final project data:', projectData);
    const project = new Project(projectData);
    await project.save();

    // Populate team members with full details before returning
    await project.populate('teamMembers', 'name email skills collegeId bio');

    // Send response immediately to unblock the UI
    res.json(project);

    // Send emails to students and team members asynchronously (Fire and Forget)
    (async () => {
      try {
        const creator = await User.findById(req.user.id);

        // Send GitHub setup emails if GitHub repo creation is enabled
        if (shouldCreateGithubRepo && teamMembersGithub && teamMembersGithub.length > 0) {
          console.log('📧 Sending GitHub setup emails to team members...');
          try {
            // Parallelize GitHub emails
            await Promise.allSettled(teamMembersGithub.map(async (member) => {
              const subject = `GitHub Repository Invitation: ${title}`;
              const html = `
                    <h2>You're Invited to Join a GitHub Repository!</h2>
                    <p>Hi ${member.name},</p>
                    <p>${creator.name || 'A team member'} has invited you to collaborate on the project <strong>${title}</strong> on GitHub.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0;">Project Details:</h3>
                      <ul style="margin: 10px 0;">
                        <li><strong>Project Name:</strong> ${title}</li>
                        <li><strong>Description:</strong> ${description || 'No description provided'}</li>
                        <li><strong>Your GitHub Username:</strong> <code>${member.githubUsername}</code></li>
                        <li><strong>Project Creator:</strong> ${creator.name || 'Unknown'}</li>
                      </ul>
                    </div>

                    <h3>What to Do:</h3>
                    <ol>
                      <li><strong>Create a GitHub Repository:</strong>
                        <ul>
                          <li>Go to <a href="https://github.com/new">github.com/new</a></li>
                          <li>Name it something like: <code>${title.toLowerCase().replace(/\s+/g, '-')}</code></li>
                          <li>Create the repository</li>
                        </ul>
                      </li>
                      <li><strong>Share the Repository URL with the creator</strong></li>
                      <li><strong>The creator will link it in the Project Management System</strong></li>
                    </ol>

                    <h3>Team Members:</h3>
                    <ul>
                      ${teamMembersGithub.map(m => `<li><strong>${m.name}</strong> (GitHub: <code>${m.githubUsername}</code>)</li>`).join('')}
                    </ul>

                    <hr>
                    <p>Best regards,<br><strong>Your Project Management System</strong></p>
                  `;

              try {
                // Use centralized email service
                await emailService.sendEmail(member.email, subject, html);
                console.log(`✅ GitHub setup email sent to ${member.email}`);
              } catch (err) {
                console.error(`❌ Failed to send email to ${member.email}:`, err.message);
              }
            }));
          } catch (githubEmailErr) {
            console.error('❌ Error sending GitHub setup emails:', githubEmailErr.message);
          }
        }

        // Parallelize other emails
        const emailPromises = [];

        // Send email to all team members
        if (teamMemberIds && teamMemberIds.length > 0) {
          teamMemberIds.forEach(memberId => {
            emailPromises.push((async () => {
              const member = await User.findById(memberId);
              if (member) {
                console.log('📧 Sending team member email to:', member.email);
                await emailService.sendTeamMemberAddedEmail(
                  member.email,
                  member.name,
                  title,
                  creator.name
                );
              }
            })());
          });
        }

        // Send email to mentor
        if (mentorId) {
          emailPromises.push((async () => {
            const mentor = await User.findById(mentorId);
            if (mentor) {
              console.log('📧 Sending mentor email to:', mentor.email);
              await emailService.sendMentorAddedEmail(
                mentor.email,
                mentor.name,
                title,
                description,
                creator.name
              );
            }
          })());
        }

        // Send email to students if student is creating
        if (req.user.role === 'Student') {
          emailPromises.push(emailService.sendProjectCreatedEmail(
            creator.email,
            creator.name,
            title,
            description
          ));
        }

        await Promise.allSettled(emailPromises);

      } catch (emailErr) {
        console.error('❌ Error sending project creation emails:', emailErr.message);
        // Don't fail the request if email fails (response already sent)
      }
    })();
  } catch (err) {
    console.log('Error creating project:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get available projects for joining (admin-created, no student)
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ msg: 'Only students can view available projects' });
    const allProjects = await Project.find({}).populate('creator', 'role');
    const projects = allProjects.filter(p => p.creator && p.creator.role === 'Admin' && (!p.students || p.students.length === 0));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Check if email is registered in the system
router.post('/check-email', auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ registered: false, msg: 'Email is required' });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user) {
      res.json({ registered: true, name: user.name });
    } else {
      res.json({ registered: false });
    }
  } catch (err) {
    res.status(500).json({ registered: false, msg: 'Server error' });
  }
});

// Join project
router.put('/:id/join', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ msg: 'Only students can join projects' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not available' });

    const { mentor, teamMembers } = req.body;

    // Enforce teamSize limit
    const maxMembers = project.teamSize || 3;

    // Process team members - handle both array of objects and array of emails
    if (teamMembers && teamMembers.length > 0) {
      if (teamMembers.length > maxMembers) {
        return res.status(400).json({ error: `Team size limit is ${maxMembers}. You provided ${teamMembers.length} members.` });
      }

      const processedMemberIds = [];
      const notFoundEmails = [];

      for (const member of teamMembers) {
        let email;
        if (typeof member === 'string') {
          email = member;
        } else if (typeof member === 'object' && member.email) {
          email = member.email;
        }

        if (!email || !email.trim()) continue;

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (user) {
          processedMemberIds.push(user._id);
        } else {
          notFoundEmails.push(email);
        }
      }

      if (notFoundEmails.length > 0) {
        return res.status(400).json({
          error: `The following email(s) are not registered in the system: ${notFoundEmails.join(', ')}. Please ask them to register first.`,
          unregisteredEmails: notFoundEmails
        });
      }
      project.teamMembers = processedMemberIds;
    }

    if (!project.students.includes(req.user.id)) {
      project.students.push(req.user.id);
      if (project.status === 'Planning') {
        project.status = 'Active';
      }
    }
    if (mentor) project.mentor = mentor;

    await project.save();
    await project.populate('creator students teamMembers mentor', 'name email skills bio');
    res.json(project);
  } catch (e) {
    console.log('Error in join:', e);
    res.status(400).json({ error: e.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  const { title, description, teamMembers, mentor, startDate, endDate, status } = req.body;
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    const isCreator = project.creator.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';
    const isTeamMember = project.teamMembers.some(id => id.toString() === req.user.id);
    const isStudent = project.students.some(id => id.toString() === req.user.id);

    if (!isCreator && !isAdmin && !isTeamMember && !isStudent) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    let updateData = { title, description, teamMembers, startDate, endDate, status };
    if (mentor !== undefined) {
      if (mentor) {
        const mentorUser = await User.findOne({ email: mentor });
        updateData.mentor = mentorUser ? mentorUser._id : null;
      } else {
        updateData.mentor = null;
      }
    }

    project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update project progress
router.put('/:id/progress', auth, async (req, res) => {
  const { progress } = req.body;
  console.log('Progress update request:', { projectId: req.params.id, progress, user: req.user });
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ msg: 'Project not found' });
    }
    console.log('Project found:', { creator: project.creator, mentor: project.mentor, teamMembers: project.teamMembers });
    const isCreator = project.creator.toString() === req.user.id;
    const isMentor = project.mentor?.toString() === req.user.id;
    const isTeamMember = project.teamMembers.some(tm => tm.toString() === req.user.id);
    const isAdmin = req.user.role === 'Admin';
    console.log('Authorization check:', { isCreator, isMentor, isTeamMember, isAdmin });
    if (!isCreator && !isMentor && !isTeamMember && !isAdmin) {
      console.log('Not authorized');
      return res.status(401).json({ msg: 'Not authorized' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, { progress }, { new: true });
    console.log('Progress updated to:', progress);
    res.json(project);
  } catch (err) {
    console.log('Error updating progress:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Toggle SOS/Stuck Status
router.put('/:id/sos', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    // Allow students/team members to toggle panic mode
    const oldStatus = project.isStuck;
    project.isStuck = !project.isStuck;
    await project.save();

    console.log(`SOS status toggled for project ${project.title}: ${project.isStuck}`);

    // If SOS turned ON, send email to mentor
    if (!oldStatus && project.isStuck) {
      try {
        const student = await User.findById(req.user.id);
        await project.populate('mentor');

        if (project.mentor && project.mentor.email) {
          console.log(`📧 Sending SOS email to mentor: ${project.mentor.email}`);

          // Generate clear SOS link with project ID and token
          const clearLink = `http://localhost:5000/api/projects/${project._id}/clear-sos?token=${project._id}`;

          const subject = `🚨 SOS Alert: Project "${project.title}" Needs Help!`;
          const html = `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffcccb; border-radius: 10px; background-color: #fff5f5;">
                <h2 style="color: #d90429;">🚨 SOS Signal Received!</h2>
                <p>Hello <strong>${project.mentor.name}</strong>,</p>
                <p>A student has flagged that they are <strong>STUCK</strong> and need immediate assistance.</p>
                
                <div style="background: #fff; padding: 15px; border-left: 5px solid #d90429; margin: 15px 0;">
                  <p><strong>Student:</strong> ${student.name} (<a href="mailto:${student.email}">${student.email}</a>)</p>
                  <p><strong>Project:</strong> ${project.title}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <p>Please reach out to them or check the project dashboard.</p>
                
                <div style="margin: 25px 0; text-align: center;">
                  <a href="${clearLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); 
                            color: white; padding: 15px 40px; text-decoration: none; 
                            border-radius: 8px; font-weight: bold; font-size: 16px;
                            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                    ✅ I've Helped - Clear SOS Signal
                  </a>
                </div>
                
                <p style="font-size: 12px; color: #666;">
                  Click the button above after you've assisted the student. 
                  This will turn off the red alert on their screen.
                </p>
                
                <p>Best,<br>Nexus System</p>
              </div>
            `;

          // Use centralized email service which checks for admin settings
          await emailService.sendEmail(project.mentor.email, subject, html);
        }
      } catch (emailErr) {
        console.error('Error in SOS email logic:', emailErr);
      }
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Clear SOS Status via Email Link (Public endpoint for mentor email button)
router.get('/:id/clear-sos', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <h1 style="color: #ef4444;">❌ Project Not Found</h1>
              <p>The project you're looking for doesn't exist.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Clear the SOS status
    project.isStuck = false;
    await project.save();

    console.log(`✅ SOS cleared for project ${project.title} via email link`);

    // Send success HTML page
    res.send(`
      <html>
        <head>
          <title>SOS Cleared - Nexus</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .card {
              background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 24px;
              padding: 60px;
              text-align: center;
              max-width: 500px;
              box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            }
            .icon { font-size: 80px; margin-bottom: 20px; }
            h1 { color: #10b981; font-size: 32px; margin-bottom: 15px; }
            .project { color: #818cf8; font-size: 20px; margin-bottom: 10px; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
            .status {
              display: inline-block;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 10px 25px;
              border-radius: 25px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>SOS Signal Cleared!</h1>
            <p class="project">${project.title}</p>
            <p>The student's screen will no longer show the red emergency alert. Thank you for helping!</p>
            <span class="status">Mission Accomplished</span>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('Error clearing SOS:', err);
    res.send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
          <div style="text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <h1 style="color: #ef4444;">❌ Something Went Wrong</h1>
            <p>Please try again or contact support.</p>
          </div>
        </body>
      </html>
    `);
  }
});

module.exports = router;