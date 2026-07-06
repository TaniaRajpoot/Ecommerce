import Category from '../models/Category.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdOrSlug = async (req, res, next) => {
  const param = req.params.idOrSlug;

  try {
    let category;

    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(param);
    } else {
      category = await Category.findOne({ slug: param });
    }

    if (!category) {
      res.status(404);
      return next(new Error('Category not found'));
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      res.status(400);
      return next(new Error('Category name is required'));
    }

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      res.status(400);
      return next(new Error('Category already exists'));
    }

    const category = await Category.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      return next(new Error('Category not found'));
    }

    category.name = name || category.name;
    category.description = description || category.description;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      res.status(404);
      return next(new Error('Category not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
