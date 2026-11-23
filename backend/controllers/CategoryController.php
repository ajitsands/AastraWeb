<?php

class CategoryController extends Controller
{
    public function index(): void
    {
        $onlyActive = isset($_GET['all']) ? false : true;
        $model = new CategoryModel();
        $this->success($model->getAll($onlyActive));
    }

    public function show(array $params): void
    {
        $model = new CategoryModel();
        $category = $model->findByIdOrSlug($params['id']);
        if (!$category) {
            $this->error('Category not found', 404);
        }

        $itemModel = new ItemModel();
        $groupModel = new GroupModel();
        $subModel = new SubCategoryModel();
        $category['sub_categories'] = $subModel->getAll(['category_id' => $category['id'], 'only_active' => true]);
        $category['items'] = $itemModel->getAll(['category_id' => $category['id'], 'only_active' => true]);
        $category['groups'] = $groupModel->getAll(['category_id' => $category['id'], 'only_active' => true]);

        $this->success($category);
    }

    public function store(): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        if (empty($input['name'])) {
            $this->error('Category name is required', 422);
        }
        $model = new CategoryModel();
        $created = $model->create($input);
        $this->success($created, 'Category created', 201);
    }

    public function update(array $params): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        $model = new CategoryModel();
        $updated = $model->update((int)$params['id'], $input);
        if (!$updated) {
            $this->error('Category not found', 404);
        }
        $this->success($updated, 'Category updated');
    }

    public function destroy(array $params): void
    {
        $this->requireAuth();
        $model = new CategoryModel();
        $model->delete((int)$params['id']);
        $this->success(null, 'Category deleted');
    }
}
