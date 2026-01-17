const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

router.post('/', jobController.createJob);           // Công ty đăng job
router.get('/', jobController.getAllJobs);           // Xem tất cả job
router.get('/:id', jobController.getJobById);
router.post('/apply', jobController.applyJob);       // Sinh viên nộp đơn
router.get('/:id/applicants', jobController.getJobApplicants); // Xem ai đã nộp vào job này
router.post('/update-status', jobController.updateApplicationStatus);

module.exports = router;