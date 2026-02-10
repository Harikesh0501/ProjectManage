const mongoose = require('mongoose');

const RubricSchema = new mongoose.Schema({
    name: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional, if specific to a project
    isGlobal: { type: Boolean, default: false }, // If true, available for all projects
    criteria: [{
        name: { type: String, required: true },
        description: String,
        weight: { type: Number, default: 1 }, // Multiplier for the score
        maxScore: { type: Number, default: 10 }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Rubric', RubricSchema);
