<?php

class FinishController extends Controller
{
    public function index(): void
    {
        $onlyActive = isset($_GET['all']) ? false : true;
        $model = new FinishModel();
        $this->success($model->getAll($onlyActive));
    }

    public function show(array $params): void
    {
        $model = new FinishModel();
        $finish = $model->findByIdOrSlug($params['id']);
        if (!$finish) {
            $this->error('Finish not found', 404);
        }
        $itemModel = new ItemModel();
        $finish['items'] = $itemModel->getAll(['finish_id' => $finish['id'], 'only_active' => true]);
        $this->success($finish);
    }

    public function store(): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        if (empty($input['name'])) {
            $this->error('Finish name is required', 422);
        }
        $model = new FinishModel();
        $created = $model->create($input);
        $this->success($created, 'Finish created', 201);
    }

    public function update(array $params): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        $model = new FinishModel();
        $updated = $model->update((int)$params['id'], $input);
        if (!$updated) {
            $this->error('Finish not found', 404);
        }
        $this->success($updated, 'Finish updated');
    }

    public function destroy(array $params): void
    {
        $this->requireAuth();
        $model = new FinishModel();
        $model->delete((int)$params['id']);
        $this->success(null, 'Finish deleted');
    }
}
