import { ResourceCategory, StudyResource } from '../models';
import { UploadResult } from '../utils/fileUpload';

interface CreateResourceData {
  user_id: string;
  title: string;
  description?: string;
  categoryName: string;
  uploadResult: UploadResult;
}

interface UpdateResourceData {
  title?: string;
  description?: string;
  categoryName?: string;
}

export class ResourceService {

  static async findOrCreateCategory(categoryName: string): Promise<ResourceCategory> {
    // Check if category exists (case-insensitive)
    let category = await ResourceCategory.findOne({
      where: {
        name: categoryName.trim(),
      },
    });

    // If category doesn't exist, create it
    if (!category) {
      category = await ResourceCategory.create({
        name: categoryName.trim(),
      });
    }

    return category;
  }

  static async createResource(data: CreateResourceData): Promise<StudyResource> {
    try {
      // Find or create category
      const category = await this.findOrCreateCategory(data.categoryName);

      // Create the resource
      const resource = await StudyResource.create({
        user_id: data.user_id,
        title: data.title,
        description: data.description || '',
        category: category.category_id,
        file_url: data.uploadResult.url,
        download_count: 0,
      });

      // Load associations
      await resource.reload({
        include: [
          { association: 'user', attributes: ['user_id', 'full_name', 'email'] },
          { association: 'resourceCategory', attributes: ['category_id', 'name'] },
        ],
      });

      return resource;
    } catch (error) {
      throw new Error(`Failed to create resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  static async getResources(filters?: {
    user_id?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ resources: StudyResource[]; total: number }> {
    try {
      const whereClause: any = {};

      if (filters?.user_id) {
        whereClause.user_id = filters.user_id;
      }

      if (filters?.category) {
        // Find category by name
        const category = await ResourceCategory.findOne({
          where: { name: filters.category },
        });
        if (category) {
          whereClause.category = category.category_id;
        }
      }

      if (filters?.search) {
        whereClause.title = {
          [require('sequelize').Op.iLike]: `%${filters.search}%`,
        };
      }

      const { count, rows } = await StudyResource.findAndCountAll({
        where: whereClause,
        include: [
          { association: 'user', attributes: ['user_id', 'full_name', 'email'] },
          { association: 'resourceCategory', attributes: ['category_id', 'name'] },
        ],
        order: [['created_at', 'DESC']],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      });

      return {
        resources: rows,
        total: count,
      };
    } catch (error) {
      throw new Error(`Failed to fetch resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getResourceById(resource_id: string): Promise<StudyResource | null> {
    try {
      const resource = await StudyResource.findByPk(resource_id, {
        include: [
          { association: 'user', attributes: ['user_id', 'full_name', 'email'] },
          { association: 'resourceCategory', attributes: ['category_id', 'name'] },
        ],
      });

      return resource;
    } catch (error) {
      throw new Error(`Failed to fetch resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateResource(
    resource_id: string,
    user_id: string,
    data: UpdateResourceData
  ): Promise<StudyResource> {
    try {
      const resource = await StudyResource.findByPk(resource_id);

      if (!resource) {
        throw new Error('Resource not found');
      }

      // Check if user owns the resource
      if (resource.user_id !== user_id) {
        throw new Error('Unauthorized: You can only update your own resources');
      }

      // Update category if provided
      if (data.categoryName) {
        const category = await this.findOrCreateCategory(data.categoryName);
        resource.category = category.category_id;
      }

      // Update other fields
      if (data.title) {
        resource.title = data.title;
      }

      if (data.description !== undefined) {
        resource.description = data.description;
      }

      await resource.save();

      // Reload with associations
      await resource.reload({
        include: [
          { association: 'user', attributes: ['user_id', 'full_name', 'email'] },
          { association: 'resourceCategory', attributes: ['category_id', 'name'] },
        ],
      });

      return resource;
    } catch (error) {
      throw new Error(`Failed to update resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteResource(resource_id: string, user_id: string): Promise<void> {
    try {
      const resource = await StudyResource.findByPk(resource_id);

      if (!resource) {
        throw new Error('Resource not found');
      }

      // Check if user owns the resource
      if (resource.user_id !== user_id) {
        throw new Error('Unauthorized: You can only delete your own resources');
      }

      await resource.destroy();
    } catch (error) {
      throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async incrementDownloadCount(resource_id: string): Promise<StudyResource> {
    try {
      const resource = await StudyResource.findByPk(resource_id);

      if (!resource) {
        throw new Error('Resource not found');
      }

      resource.download_count += 1;
      await resource.save();

      return resource;
    } catch (error) {
      throw new Error(`Failed to update download count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllCategories(): Promise<ResourceCategory[]> {
    try {
      const categories = await ResourceCategory.findAll({
        order: [['name', 'ASC']],
      });

      return categories;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  static async getResourcesByUser(user_id: string): Promise<StudyResource[]> {
    try {
      const resources = await StudyResource.findAll({
        where: { user_id: user_id },
        include: [
          { association: 'user', attributes: ['user_id', 'full_name', 'email'] },
          { association: 'resourceCategory', attributes: ['category_id', 'name'] },
        ],
        order: [['created_at', 'DESC']],
      });
      return resources;
    } catch (error) {
      throw new Error(`Failed to fetch resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
