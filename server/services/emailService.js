const { Resend } = require('resend');
require('dotenv').config();

// Use Resend HTTP API (Render blocks SMTP ports)
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address - change this after verifying your domain on resend.com/domains
// Free tier: use 'onboarding@resend.dev' (can only send to your own email)
// With verified domain: use 'noreply@yourdomain.com' (can send to anyone)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Project Tracker <onboarding@resend.dev>';

const Settings = require('../models/Settings');

// Email templates
const emailTemplates = {
  milestoneAdded: (studentName, milestoneTitle, dueDate) => ({
    subject: `New Milestone: ${milestoneTitle}`,
    html: `
      <h2>Hello ${studentName},</h2>
      <p>A new milestone has been assigned to your project.</p>
      <p><strong>Milestone:</strong> ${milestoneTitle}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      <p>Please log in to view the complete details and start working on it.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  milestoneSubmitted: (mentorName, studentName, milestoneTitle, submissionLink) => ({
    subject: `Milestone Submission: ${milestoneTitle}`,
    html: `
      <h2>Hello ${mentorName},</h2>
      <p><strong>${studentName}</strong> has submitted milestone <strong>${milestoneTitle}</strong></p>
      <p><strong>Submission Link:</strong> <a href="${submissionLink}" target="_blank">${submissionLink}</a></p>
      <p>Please review and approve/reject the submission.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  milestoneApproved: (studentName, milestoneTitle, mentorNotes = '') => ({
    subject: `Milestone Approved: ${milestoneTitle}`,
    html: `
      <h2>Congratulations ${studentName}!</h2>
      <p>Your milestone <strong>${milestoneTitle}</strong> has been approved.</p>
      ${mentorNotes ? `<p><strong>Mentor Notes:</strong> ${mentorNotes}</p>` : ''}
      <p>Great work! Keep it up.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  milestoneRejected: (studentName, milestoneTitle, mentorNotes = '') => ({
    subject: `Milestone Needs Revision: ${milestoneTitle}`,
    html: `
      <h2>Hello ${studentName},</h2>
      <p>Your milestone submission for <strong>${milestoneTitle}</strong> needs revision.</p>
      ${mentorNotes ? `<p><strong>Feedback:</strong> ${mentorNotes}</p>` : ''}
      <p>Please make the necessary changes and resubmit.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  feedbackReceived: (studentName, mentorName, projectTitle, rating, message) => ({
    subject: `Feedback from ${mentorName} on ${projectTitle}`,
    html: `
      <h2>Hello ${studentName},</h2>
      <p>You have received feedback from <strong>${mentorName}</strong> on project <strong>${projectTitle}</strong></p>
      <p><strong>Rating:</strong> ${'⭐'.repeat(rating)}</p>
      <p><strong>Feedback:</strong></p>
      <p>${message}</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  projectCreated: (studentName, projectTitle, projectDescription) => ({
    subject: `New Project: ${projectTitle}`,
    html: `
      <h2>Hello ${studentName},</h2>
      <p>You have been added to a new project!</p>
      <p><strong>Project:</strong> ${projectTitle}</p>
      <p><strong>Description:</strong> ${projectDescription}</p>
      <p>Please log in to view the complete details and start working on it.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  teamMemberAdded: (memberName, projectTitle, creatorName) => ({
    subject: `Added to Team: ${projectTitle}`,
    html: `
      <h2>Hello ${memberName},</h2>
      <p><strong>${creatorName}</strong> has added you to the team for project <strong>${projectTitle}</strong></p>
      <p>Please log in to view the project details and collaborate with your team.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  meetingScheduled: (memberName, mentorName, meetingTitle, projectTitle, scheduledDate, duration, googleMeetLink) => ({
    subject: `Meeting Scheduled: ${meetingTitle}`,
    html: `
      <h2>Hello ${memberName},</h2>
      <p><strong>${mentorName}</strong> has scheduled a meeting for project <strong>${projectTitle}</strong></p>
      <p><strong>Meeting Title:</strong> ${meetingTitle}</p>
      <p><strong>Scheduled Date:</strong> ${new Date(scheduledDate).toLocaleString()}</p>
      <p><strong>Duration:</strong> ${duration} minutes</p>
      ${googleMeetLink ? `<p><strong>Meeting Link:</strong> <a href="${googleMeetLink}" target="_blank">Join Meeting</a></p>` : '<p><strong>Meeting Link:</strong> Will be shared soon</p>'}
      <p>Please mark your calendar and join the meeting on time.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  }),

  mentorAddedToProject: (mentorName, projectTitle, projectDescription, creatorName) => ({
    subject: `Mentor Assignment: ${projectTitle}`,
    html: `
      <h2>Hello ${mentorName},</h2>
      <p><strong>${creatorName}</strong> has added you as mentor for project <strong>${projectTitle}</strong></p>
      <p><strong>Project Description:</strong> ${projectDescription}</p>
      <p>Please log in to view the project details, team members, and start guiding the team.</p>
      <p>Best regards,<br>Project Tracking System</p>
    `
  })
};

/**
 * Send email via Resend HTTP API
 */
async function sendEmail(to, subject, html) {
  try {
    const settings = await Settings.findOne();
    if (settings && settings.services && !settings.services.emailService) {
      console.warn('⚠️ Email service is disabled by administrator.');
      return { success: false, message: 'Email service disabled by admin' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured.');
      return { success: false, message: 'Email service not configured' };
    }

    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendMilestoneAddedEmail(studentEmail, studentName, milestoneTitle, dueDate) {
  const { subject, html } = emailTemplates.milestoneAdded(studentName, milestoneTitle, dueDate);
  return sendEmail(studentEmail, subject, html);
}

async function sendMilestoneSubmittedEmail(mentorEmail, mentorName, studentName, milestoneTitle, submissionLink) {
  const { subject, html } = emailTemplates.milestoneSubmitted(mentorName, studentName, milestoneTitle, submissionLink);
  return sendEmail(mentorEmail, subject, html);
}

async function sendMilestoneApprovedEmail(studentEmail, studentName, milestoneTitle, mentorNotes) {
  const { subject, html } = emailTemplates.milestoneApproved(studentName, milestoneTitle, mentorNotes);
  return sendEmail(studentEmail, subject, html);
}

async function sendMilestoneRejectedEmail(studentEmail, studentName, milestoneTitle, mentorNotes) {
  const { subject, html } = emailTemplates.milestoneRejected(studentName, milestoneTitle, mentorNotes);
  return sendEmail(studentEmail, subject, html);
}

async function sendFeedbackEmail(studentEmail, studentName, mentorName, projectTitle, rating, message) {
  const { subject, html } = emailTemplates.feedbackReceived(studentName, mentorName, projectTitle, rating, message);
  return sendEmail(studentEmail, subject, html);
}

async function sendProjectCreatedEmail(studentEmail, studentName, projectTitle, projectDescription) {
  const { subject, html } = emailTemplates.projectCreated(studentName, projectTitle, projectDescription);
  return sendEmail(studentEmail, subject, html);
}

async function sendTeamMemberAddedEmail(memberEmail, memberName, projectTitle, creatorName) {
  const { subject, html } = emailTemplates.teamMemberAdded(memberName, projectTitle, creatorName);
  return sendEmail(memberEmail, subject, html);
}

async function sendMeetingScheduledEmail(memberEmail, memberName, mentorName, meetingTitle, projectTitle, scheduledDate, duration, googleMeetLink) {
  const { subject, html } = emailTemplates.meetingScheduled(memberName, mentorName, meetingTitle, projectTitle, scheduledDate, duration, googleMeetLink);
  return sendEmail(memberEmail, subject, html);
}

async function sendMentorAddedEmail(mentorEmail, mentorName, projectTitle, projectDescription, creatorName) {
  const { subject, html } = emailTemplates.mentorAddedToProject(mentorName, projectTitle, projectDescription, creatorName);
  return sendEmail(mentorEmail, subject, html);
}

async function sendMeetingLink(emails, zoomLink, meetingTitle, scheduledDate, projectId) {
  const settings = await Settings.findOne();
  if (settings && settings.services && !settings.services.emailService) {
    console.warn('⚠️ Email service is disabled by administrator.');
    return { success: false, message: 'Email service disabled by admin' };
  }

  if (!Array.isArray(emails) || emails.length === 0) {
    console.log('No emails provided to send meeting link');
    return;
  }

  const emailList = emails.filter(email => email && typeof email === 'string');
  if (emailList.length === 0) {
    console.log('No valid emails found');
    return;
  }

  const subject = `Zoom Meeting: ${meetingTitle}`;
  const html = `
    <h2>Meeting Invitation</h2>
    <p>You are invited to join a Zoom meeting.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Meeting:</strong> ${meetingTitle}</p>
      <p><strong>Date & Time:</strong> ${scheduledDate}</p>
      <p style="margin-top: 20px;">
        <a href="${zoomLink}" target="_blank" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Join Zoom Meeting
        </a>
      </p>
      <p style="font-size: 12px; color: #666; margin-top: 15px;">
        Or copy this link: <br><code>${zoomLink}</code>
      </p>
    </div>
    <p>Best regards,<br>Project Tracking System</p>
  `;

  try {
    const result = await sendEmail(emailList, subject, html);
    if (result.success) {
      console.log(`✅ Meeting link sent to ${emailList.length} recipients`);
    }
    return result.success;
  } catch (error) {
    console.error('Error sending meeting link email:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendMilestoneAddedEmail,
  sendMilestoneSubmittedEmail,
  sendMilestoneApprovedEmail,
  sendMilestoneRejectedEmail,
  sendFeedbackEmail,
  sendProjectCreatedEmail,
  sendTeamMemberAddedEmail,
  sendMeetingScheduledEmail,
  sendMentorAddedEmail,
  sendMeetingLink
};
