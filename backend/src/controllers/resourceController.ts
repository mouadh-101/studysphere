import { Request, Response } from 'express';
import { ResourceService } from '../services/resourceService'
import { upload, formatUploadResult, deleteFile, getFilePath } from '../utils/fileUpload';


export const uploadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category } = req.body;
    const user_id = (req as any).user.user_id; // From auth middleware

    // Validate required fields
    if (!title || !category) {
      res.status(400).json({
        success: false,
        message: 'Title and category are required',
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Format upload result
    const uploadResult = formatUploadResult(req.file);

    // Create resource
    const resource = await ResourceService.createResource({
      user_id,
      title,
      description,
      categoryName: category,
      uploadResult,
    });

    res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully',
      data: {
        resource,
      },
    });
  } catch (error) {
    // Delete uploaded file if resource creation fails
    if (req.file) {
      deleteFile(req.file.path);
    }

    console.error('Upload resource error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload resource',
    });
  }
};


export const getResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, category, search, limit, offset } = req.query;

    const filters = {
      user_id: user_id as string | undefined,
      category: category as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const result = await ResourceService.getResources(filters);

    res.status(200).json({
      success: true,
      message: 'Resources fetched successfully',
      data: {
        resources: result.resources,
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch resources',
    });
  }
};

export const getResourceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await ResourceService.getResourceById(id);

    if (!resource) {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Resource fetched successfully',
      data: {
        resource,
      },
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch resource',
    });
  }
};


export const updateResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const user_id = (req as any).user.user_id;

    const resource = await ResourceService.updateResource(id, user_id, {
      title,
      description,
      categoryName: category,
    });

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: {
        resource,
      },
    });
  } catch (error) {
    console.error('Update resource error:', error);
    const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update resource',
    });
  }
};

export const deleteResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = (req as any).user.user_id;

    // Get resource to delete the file
    const resource = await ResourceService.getResourceById(id);
    
    if (resource) {
      // Extract filename from URL and delete file
      const filename = resource.file_url.split('/').pop();
      if (filename) {
        deleteFile(getFilePath(filename));
      }
    }

    await ResourceService.deleteResource(id, user_id);

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete resource',
    });
  }
};

export const downloadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await ResourceService.getResourceById(id);

    if (!resource) {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
      return;
    }

    // Increment download count
    await ResourceService.incrementDownloadCount(id);

    // Extract filename from URL
    const filename = resource.file_url.split('/').pop();
    if (!filename) {
      res.status(500).json({
        success: false,
        message: 'Invalid file URL',
      });
      return;
    }

    const filePath = getFilePath(filename);

    // Send file
    res.download(filePath, resource.title, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download file',
          });
        }
      }
    });
  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download resource',
    });
  }
};


export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await ResourceService.getAllCategories();

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch categories',
    });
  }
};
export const getResourcesByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // user id from auth middleware
    const user_id = (req as any).user.user_id;

    const resources = await ResourceService.getResourcesByUser(user_id);
    res.status(200).json({
      success: true,
      message: 'User resources fetched successfully',
        data: { resources },
    });
  } catch (error) {
    console.error('Get user resources error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch user resources',
    });
  }
};
