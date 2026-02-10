const axios = require('axios');
require('dotenv').config();

// Enable mock mode for testing without real Zoom credentials
const USE_MOCK_MODE = process.env.USE_MOCK_MODE === 'true' || !process.env.ZOOM_CLIENT_ID;

const zoomService = {
  // Get Zoom Access Token
  getAccessToken: async () => {
    try {
      if (USE_MOCK_MODE) {
        console.log('🔑 [MOCK MODE] Using mock access token...');
        return 'mock_token_' + Date.now();
      }

      console.log('🔑 Getting Zoom access token...');
      console.log('   Account ID:', process.env.ZOOM_ACCOUNT_ID ? '✓' : '✗ MISSING');
      console.log('   Client ID:', process.env.ZOOM_CLIENT_ID ? '✓' : '✗ MISSING');
      console.log('   Client Secret:', process.env.ZOOM_CLIENT_SECRET ? '✓' : '✗ MISSING');

      const response = await axios.post(
        'https://zoom.us/oauth/token',
        {},
        {
          params: {
            grant_type: 'account_credentials',
            account_id: process.env.ZOOM_ACCOUNT_ID
          },
          auth: {
            username: process.env.ZOOM_CLIENT_ID,
            password: process.env.ZOOM_CLIENT_SECRET
          }
        }
      );
      console.log('✅ Zoom token obtained');
      return response.data.access_token;
    } catch (error) {
      console.error('❌ Failed to get Zoom token:', error.response?.data || error.message);
      console.log('\n💡 TIP: Set USE_MOCK_MODE=true in .env to test without real Zoom credentials');
      throw new Error(`Failed to get Zoom token: ${error.response?.data?.error || error.message}`);
    }
  },

  // Create Zoom Meeting (using account credentials with hardcoded user ID)
  createMeeting: async (mentorId, title, startTime, projectId) => {
    try {
      if (USE_MOCK_MODE) {
        console.log('🚀 [MOCK MODE] Creating mock Zoom meeting...');
        const mockMeetingId = Math.floor(Math.random() * 10000000000);
        const mockLink = `https://zoom.us/j/${mockMeetingId}?pwd=MockPassword123`;
        
        console.log('✅ Mock meeting created at Zoom:', {
          id: mockMeetingId,
          join_url: mockLink
        });

        return {
          meetingId: mockMeetingId,
          zoomMeetingLink: mockLink,
          startTime: new Date(startTime).toISOString(),
          duration: 60
        };
      }

      console.log('🚀 Creating Zoom meeting...');
      const accessToken = await zoomService.getAccessToken();

      const meetingData = {
        topic: title,
        type: 2, // Scheduled meeting
        start_time: new Date(startTime).toISOString().slice(0, 16),
        duration: 60,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: false,
          waiting_room: false,
          meeting_authentication: false
        }
      };

      console.log('📋 Meeting data:', meetingData);

      // Try to create meeting with account-level API
      // For account credentials, we need to use a different endpoint
      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        meetingData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Meeting created at Zoom:', {
        id: response.data.id,
        join_url: response.data.join_url
      });

      return {
        meetingId: response.data.id,
        zoomMeetingLink: response.data.join_url,
        startTime: response.data.start_time,
        duration: response.data.duration
      };
    } catch (error) {
      console.error('❌ Failed to create Zoom meeting:', error.response?.data || error.message);
      
      // If the above fails, try alternative approach
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.log('🔄 Trying alternative meeting creation method...');
        try {
          const accessToken = await zoomService.getAccessToken();
          
          // Alternative: Create meeting with a different approach
          const response = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
              topic: title,
              type: 1, // Instant meeting (use this instead)
              start_time: new Date(startTime).toISOString(),
              duration: 60,
              timezone: 'UTC',
              settings: {
                host_video: true,
                participant_video: true,
                join_before_host: true,
                waiting_room: false,
                meeting_authentication: false
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          return {
            meetingId: response.data.id,
            zoomMeetingLink: response.data.join_url,
            startTime: response.data.start_time,
            duration: response.data.duration
          };
        } catch (altError) {
          console.error('❌ Alternative method also failed:', altError.response?.data || altError.message);
          throw new Error(`Failed to create Zoom meeting: ${altError.response?.data?.error || altError.message}`);
        }
      }
      
      throw new Error(`Failed to create Zoom meeting: ${error.response?.data?.error || error.message}`);
    }
  },

  // Get Meeting Details
  getMeetingDetails: async (meetingId) => {
    try {
      if (USE_MOCK_MODE) {
        console.log('🔍 [MOCK MODE] Getting meeting details for:', meetingId);
        return {
          id: meetingId,
          topic: 'Mock Meeting',
          start_time: new Date().toISOString(),
          duration: 60,
          status: 'active',
          join_url: `https://zoom.us/j/${meetingId}?pwd=mock`
        };
      }

      const accessToken = await zoomService.getAccessToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get meeting details: ${error.message}`);
    }
  },

  // Get Registrants (participants)
  getMeetingParticipants: async (meetingId) => {
    try {
      if (USE_MOCK_MODE) {
        console.log('👥 [MOCK MODE] Getting participants for:', meetingId);
        return [
          {
            id: 'mock_user_1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            status: 'approved'
          }
        ];
      }

      const accessToken = await zoomService.getAccessToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/registrants`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data.registrants || [];
    } catch (error) {
      throw new Error(`Failed to get meeting participants: ${error.message}`);
    }
  },

  // Add Meeting Registrant
  addMeetingRegistrant: async (meetingId, firstName, lastName, email) => {
    try {
      if (USE_MOCK_MODE) {
        console.log(`✅ [MOCK MODE] Added registrant ${firstName} ${lastName} (${email}) to meeting ${meetingId}`);
        return {
          id: 'mock_registrant_' + Date.now(),
          first_name: firstName,
          last_name: lastName,
          email: email,
          status: 'approved'
        };
      }

      const accessToken = await zoomService.getAccessToken();

      const response = await axios.post(
        `https://api.zoom.us/v2/meetings/${meetingId}/registrants`,
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          action: 'create'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to add registrant: ${error.message}`);
    }
  },

  // Delete Meeting
  deleteMeeting: async (meetingId) => {
    try {
      if (USE_MOCK_MODE) {
        console.log(`🗑️ [MOCK MODE] Deleted meeting ${meetingId}`);
        return { success: true, message: 'Mock meeting deleted' };
      }

      const accessToken = await zoomService.getAccessToken();

      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return { success: true, message: 'Meeting deleted' };
    } catch (error) {
      throw new Error(`Failed to delete meeting: ${error.message}`);
    }
  }
};

module.exports = zoomService;
