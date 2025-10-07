import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Filter, 
  Edit3, 
  Copy, 
  Trash2, 
  Calendar,
  Image,
  FileText,
  MoreHorizontal,
  SortAsc
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface DraftListing {
  id: string;
  title: string;
  partNumber: string;
  images: string[];
  description: string;
  condition: string[];
  price: number;
  compatibility: string[];
  lastModified: Date;
  completionStatus: number;
}

export function DraftsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastModified');
  const [filterBy, setFilterBy] = useState('all');

  // Mock draft listings data
  const [drafts] = useState<DraftListing[]>([
    {
      id: '1',
      title: '2018-2022 Chevrolet Equinox Brake Caliper Assembly',
      partNumber: 'GM-45123-789',
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=200&fit=crop'],
      description: 'High-quality brake caliper assembly for Chevrolet Equinox...',
      condition: ['oem', 'used'],
      price: 89.99,
      compatibility: ['2018-2022 Chevrolet Equinox'],
      lastModified: new Date('2024-01-15'),
      completionStatus: 85
    },
    {
      id: '2',
      title: 'Honda Civic Front Bumper Cover',
      partNumber: 'HON-BMP-789',
      images: ['https://images.unsplash.com/photo-1572142844095-e432b4ca5a8d?w=200&h=200&fit=crop'],
      description: 'OEM front bumper cover in excellent condition...',
      condition: ['oem'],
      price: 245.00,
      compatibility: ['2016-2020 Honda Civic'],
      lastModified: new Date('2024-01-14'),
      completionStatus: 65
    },
    {
      id: '3',
      title: 'Ford F-150 Headlight Assembly',
      partNumber: 'FRD-HDL-456',
      images: ['https://images.unsplash.com/photo-1609044702684-eed8eb26ba00?w=200&h=200&fit=crop'],
      description: 'Complete headlight assembly with LED daytime running lights...',
      condition: ['refurbished'],
      price: 189.50,
      compatibility: ['2015-2019 Ford F-150'],
      lastModified: new Date('2024-01-12'),
      completionStatus: 90
    },
    {
      id: '4',
      title: 'Toyota Camry Side Mirror',
      partNumber: 'TOY-MIR-321',
      images: ['https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=200&h=200&fit=crop'],
      description: 'Driver side mirror with power adjustment and heating...',
      condition: ['used'],
      price: 75.99,
      compatibility: ['2012-2017 Toyota Camry'],
      lastModified: new Date('2024-01-10'),
      completionStatus: 40
    }
  ]);

  const getStatusColor = (status: number) => {
    if (status >= 80) return 'bg-green-100 text-green-700';
    if (status >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusText = (status: number) => {
    if (status >= 80) return 'Ready';
    if (status >= 60) return 'In Progress';
    return 'Incomplete';
  };

  const handleEdit = (draftId: string) => {
    toast.success(`Opening draft ${draftId} for editing`);
    // In real app, this would navigate to the editor with the draft data
  };

  const handleDuplicate = (draftId: string) => {
    toast.success(`Draft ${draftId} duplicated`);
  };

  const handleDelete = (draftId: string) => {
    toast.success(`Draft ${draftId} deleted`);
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'ready') return matchesSearch && draft.completionStatus >= 80;
    if (filterBy === 'incomplete') return matchesSearch && draft.completionStatus < 60;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Draft Listings</h1>
          <p className="text-gray-600">Manage your saved car part listings</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <SortAsc className="h-4 w-4 mr-1" />
            Sort
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title or part number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drafts</SelectItem>
                <SelectItem value="ready">Ready to Publish</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastModified">Last Modified</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{drafts.length}</p>
              <p className="text-sm text-gray-600">Total Drafts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {drafts.filter(d => d.completionStatus >= 80).length}
              </p>
              <p className="text-sm text-gray-600">Ready to Publish</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {drafts.filter(d => d.completionStatus >= 60 && d.completionStatus < 80).length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {drafts.filter(d => d.completionStatus < 60).length}
              </p>
              <p className="text-sm text-gray-600">Incomplete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drafts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDrafts.map((draft) => (
          <Card key={draft.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{draft.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Part #: {draft.partNumber}</p>
                </div>
                <Badge className={`${getStatusColor(draft.completionStatus)} ml-2`}>
                  {getStatusText(draft.completionStatus)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Image and Basic Info */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {draft.images[0] ? (
                    <ImageWithFallback
                      src={draft.images[0]}
                      alt={draft.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">${draft.price}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{draft.images.length} photos</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {draft.condition.map((cond) => (
                      <Badge key={cond} variant="outline" className="text-xs">
                        {cond.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {draft.description}
                  </p>
                </div>
              </div>

              {/* Compatibility and Completion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-medium">{draft.completionStatus}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${draft.completionStatus}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Modified: {draft.lastModified.toLocaleDateString()}
                </div>
                <div className="mt-1">
                  Fits: {draft.compatibility.join(', ')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => handleEdit(draft.id)}
                  className="flex-1"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDuplicate(draft.id)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(draft.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDrafts.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No drafts found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Create your first listing to get started'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}