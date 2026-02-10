const express = require('express');
const router = express.Router();
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const auth = require('../middleware/auth'); // Assuming auth middleware exists
const logAction = require('../utils/auditLogger');

// Get all sprints for a project
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const sprints = await Sprint.find({ project: req.params.projectId }).sort({ startDate: 1 });
        res.json(sprints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new sprint
router.post('/', auth, async (req, res) => {
    try {
        const { name, startDate, endDate, goal, projectId } = req.body;
        const sprint = new Sprint({
            name,
            startDate,
            endDate,
            goal,
            project: projectId,
            status: 'Planned'
        });
        await sprint.save();

        await logAction(req.user.id, 'CREATE_SPRINT', `Sprint: ${sprint._id}`, { name }, req);
        res.json(sprint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start/Complete Sprint
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const sprint = await Sprint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        await logAction(req.user.id, 'UPDATE_SPRINT_STATUS', `Sprint: ${sprint._id}`, { status }, req);
        res.json(sprint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Burndown Chart Data
// Calculates ideal vs actual remaining story points
// Burndown Chart Data
// Calculates ideal vs actual remaining story points
router.get('/:id/burndown', auth, async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) return res.status(404).json({ msg: 'Sprint not found' });

        const tasks = await Task.find({ sprint: sprint._id });

        const totalPoints = tasks.reduce((sum, task) => sum + (parseInt(task.storyPoints) || 0), 0);
        console.log(`[Burndown Debug] Sprint: ${sprint.name}, Tasks: ${tasks.length}, TotalPoints: ${totalPoints}`);
        console.log(`[Burndown Debug] Start: ${sprint.startDate}, End: ${sprint.endDate}`);

        // Debug: Log each task's verification status
        tasks.forEach(t => {
            console.log(`[Task Debug] ${t.title}: isVerified=${t.isVerified}, verifiedAt=${t.verifiedAt}, points=${t.storyPoints}`);
        });

        // Calculate duration in days (Inclusive: Start to End + 1 day)
        const diffTime = Math.abs(new Date(sprint.endDate) - new Date(sprint.startDate));
        const sprintDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Ideal burn rate per day
        const pointsPerDay = totalPoints / sprintDuration;

        const data = [];
        let currentDate = new Date(sprint.startDate);
        currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

        const today = new Date();
        today.setHours(23, 59, 59, 999); // Include today fully in comparison

        let chartEndDate = new Date(sprint.endDate);
        if (today > chartEndDate) {
            chartEndDate = new Date(today);
        }
        chartEndDate.setHours(23, 59, 59, 999);

        let lastActivityDate = new Date();
        tasks.forEach(t => {
            if (t.isVerified && t.verifiedAt) {
                const vDate = new Date(t.verifiedAt);
                if (vDate > lastActivityDate) lastActivityDate = vDate;
            }
        });
        lastActivityDate.setHours(23, 59, 59, 999);

        // Iterate through each day of the sprint (or until today if late)
        while (currentDate <= chartEndDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const daysPassed = Math.floor((currentDate - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24)) + 1;

            // Ideal Trend (Burn UP: 0 -> Total)
            const idealProgress = Math.min(totalPoints, (daysPassed - 1) * pointsPerDay);

            let actualSecured = null;

            // Only calculate actual for past/current days OR for the very first day of sprint (initial state)
            const sprintStart = new Date(sprint.startDate);
            sprintStart.setHours(0, 0, 0, 0);

            // Only calculate actual for past/current days OR for the very first day of sprint (initial state)
            if (currentDate <= today || currentDate.getTime() === sprintStart.getTime()) {
                // Sum points of tasks that were VERIFIED ON OR BEFORE this currentDate (end of day)
                const endOfCurrentDate = new Date(currentDate);
                endOfCurrentDate.setHours(23, 59, 59, 999);

                const securedPoints = tasks
                    .filter(t => {
                        if (!t.isVerified) return false;
                        // Use verifiedAt if available, otherwise use completedAt, otherwise current date
                        let dateToCheck = null;
                        if (t.verifiedAt) {
                            dateToCheck = new Date(t.verifiedAt);
                        } else if (t.completedAt) {
                            dateToCheck = new Date(t.completedAt);
                        } else {
                            // Fallback: If verified but no date, use today
                            dateToCheck = new Date();
                        }

                        // Normalize to start of day for comparison
                        dateToCheck.setHours(0, 0, 0, 0);
                        const compareDate = new Date(currentDate);
                        compareDate.setHours(0, 0, 0, 0);

                        return dateToCheck <= endOfCurrentDate;
                    })
                    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

                actualSecured = securedPoints;
                console.log(`[Burndown] Date: ${dateStr}, Ideal: ${Math.round(idealProgress)}, Actual: ${actualSecured}`);
            }

            data.push({
                date: dateStr,
                ideal: Math.round(idealProgress),
                actual: actualSecured
            });

            // Next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate total secured points regardless of date (for summary display)
        const securedPoints = tasks
            .filter(t => t.isVerified)
            .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        console.log(`[Burndown Result] Total: ${totalPoints}, Secured: ${securedPoints}, DataPoints: ${data.length}`);

        res.json({
            totalPoints,
            securedPoints,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
