<?php

class EnquiryController extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $model = new EnquiryModel();
        $this->success($model->getAll());
    }

    public function store(): void
    {
        $input = $this->getJsonInput();
        if (empty($input['name']) || empty($input['email']) || empty($input['message'])) {
            $this->error('Name, email, and message are required', 422);
        }
        $model = new EnquiryModel();
        $created = $model->create($input);
        $this->success($created, 'Enquiry submitted successfully', 201);
    }

    public function updateStatus(array $params): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        $status = $input['status'] ?? '';
        $model = new EnquiryModel();
        if (!$model->updateStatus((int)$params['id'], $status)) {
            $this->error('Invalid status', 422);
        }
        $this->success(null, 'Enquiry status updated');
    }
}
