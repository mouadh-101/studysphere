// Resource types
export interface Resource {
  resource_id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  download_count: number;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
  resourceCategory?: {
    category_id: string;
    name: string;
  };
}

// Category type
export interface Category {
  category_id: string;
  name: string;
}

// Upload resource data
export interface UploadResourceData {
  file: File;
  title: string;
  description?: string;
  category: string;
}

// Update resource data
export interface UpdateResourceData {
  title?: string;
  description?: string;
  category?: string;
}

// Resource response type
export interface ResourceResponse {
  success: boolean;
  message: string;
  data: {
    resource: Resource;
  };
}

// Resources list response type
export interface ResourcesListResponse {
  success: boolean;
  message: string;
  data: {
    resources: Resource[];
    total: number;
    limit: number;
    offset: number;
  };
}

// Categories response type
export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    categories: Category[];
  };
}

// Resource filters
export interface ResourceFilters {
  user_id?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
