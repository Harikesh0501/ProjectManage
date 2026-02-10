const express = require('express');
const router = express.Router();
const Rubric = require('../models/Rubric');
const Evaluation = require('../models/Evaluation');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { createNotification } = require('./notifications');
const logAction = require('../utils/auditLogger');

// Create a Rubric
router.post('/rubrics', auth, async (req, res) => {
    try {
        const { name, criteria, projectId, isGlobal } = req.body;
        const rubric = new Rubric({
            name,
            criteria,
            project: projectId,
            isGlobal,
            createdBy: req.user.id
        });
        await rubric.save();
        await logAction(req.user.id, 'CREATE_RUBRIC', `Rubric: ${rubric._id}`, { name }, req);
        res.json(rubric);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Rubrics (Global + Project specific)
router.get('/rubrics/project/:projectId', auth, async (req, res) => {
    try {
        const rubrics = await Rubric.find({
            $or: [
                { isGlobal: true },
                { project: req.params.projectId }
            ]
        });
        res.json(rubrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit Evaluation
router.post('/', auth, async (req, res) => {
    try {
        const { projectId, rubricId, scores, comments, feedback } = req.body;

        // Verify rubric to calculate total score
        const rubric = await Rubric.findById(rubricId);
        if (!rubric) return res.status(404).json({ msg: 'Rubric not found' });

        let calculatedScore = 0;
        let maxPossibleScore = 0;

        rubric.criteria.forEach(c => {
            const score = scores[c.name] || 0;
            calculatedScore += score * c.weight;
            maxPossibleScore += c.maxScore * c.weight;
        });

        // Normalize to 100 or keep raw? Let's keep raw weighted sum for now.

        const evaluation = new Evaluation({
            project: projectId,
            evaluator: req.user.id,
            rubric: rubricId,
            scores,
            comments,
            feedback,
            totalScore: calculatedScore
        });

        await evaluation.save();
        await logAction(req.user.id, 'SUBMIT_EVALUATION', `Project: ${projectId}`, { score: calculatedScore }, req);

        // Notify Project Members
        const projectData = await Project.findById(projectId);
        if (projectData) {
            const recipients = [...projectData.students, ...projectData.teamMembers];
            const uniqueRecipients = [...new Set(recipients.map(id => id.toString()))]; // Dedup

            for (const recipientId of uniqueRecipients) {
                await createNotification(
                    recipientId,
                    'milestone_reviewed', // Using closest available type
                    'Project Evaluated',
                    `Your project "${projectData.title}" has been evaluated on rubric: "${rubric.name}". Score: ${calculatedScore}`,
                    null,
                    projectId,
                    req.user.id
                );
            }
        }

        res.json(evaluation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Project Evaluations
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ project: req.params.projectId })
            .populate('evaluator', 'name email')
            .populate('rubric', 'name criteria');
        res.json(evaluations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
