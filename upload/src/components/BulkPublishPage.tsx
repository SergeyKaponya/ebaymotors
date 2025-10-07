import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  CheckCircle,
  AlertTriangle,
  Eye,
  DollarSign,
  Calendar,
  Package,
  Upload,
  Download,
  Settings
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface ReadyListing {
  id: string;
  title: string;
  partNumber: string;
  images: string[];
  price: number;
  condition: string[];
  compatibility: string[];
  completionStatus: number;
  estimatedViews: number;
  marketDemand: 'high' | 'medium' | 'low';
  lastModified: Date;
  readyToPublish: boolean;
}

export function BulkPublishPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterDemand, setFilterDemand] = useState('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);

  // Mock ready listings data
  const [listings] = useState<ReadyListing[]>([
    {
      id: '1',
      title: '2018-2022 Chevrolet Equinox Brake Caliper Assembly',
      partNumber: 'GM-45123-789',
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=200&fit=crop'],
      price: 89.99,
      condition: ['oem', 'used'],
      compatibility: ['2018-2022 Chevrolet Equinox'],
      completionStatus: 95,
      estimatedViews: 245,
      marketDemand: 'high',
      lastModified: new Date('2024-01-15'),
      readyToPublish: true
    },
    {
      id: '2',
      title: 'Ford F-150 Headlight Assembly',
      partNumber: 'FRD-HDL-456',
      images: ['https://images.unsplash.com/photo-1609044702684-eed8eb26ba00?w=200&h=200&fit=crop'],
      price: 189.50,
      condition: ['refurbished'],
      compatibility: ['2015-2019 Ford F-150'],
      completionStatus: 90,
      estimatedViews: 187,
      marketDemand: 'high',
      lastModified: new Date('2024-01-14'),
      readyToPublish: true
    },
    {
      id: '3',
      title: 'Honda Civic Front Bumper Cover',
      partNumber: 'HON-BMP-789',
      images: ['https://images.unsplash.com/photo-1572142844095-e432b4ca5a8d?w=200&h=200&fit=crop'],
      price: 245.00,
      condition: ['oem'],
      compatibility: ['2016-2020 Honda Civic'],
      completionStatus: 85,
      estimatedViews: 156,
      marketDemand: 'medium',
      lastModified: new Date('2024-01-13'),
      readyToPublish: true
    },
    {
      id: '4',
      title: 'BMW 3 Series Door Handle',
      partNumber: 'BMW-DH-123',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=200&fit=crop'],
      price: 67.99,
      condition: ['used'],
      compatibility: ['2012-2018 BMW 3 Series'],
      completionStatus: 82,
      estimatedViews: 89,
      marketDemand: 'low',
      lastModified: new Date('2024-01-12'),
      readyToPublish: false
    }
  ]);

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSelectAll = () => {
    const readyListings = filteredListings.filter(l => l.readyToPublish);
    if (selectedListings.length === readyListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(readyListings.map(l => l.id));
    }
  };

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleBulkPublish = async () => {
    if (selectedListings.length === 0) {
      toast.error('Please select listings to publish');
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);

    // Simulate bulk publishing with progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setPublishProgress(i);
    }

    toast.success(`Successfully published ${selectedListings.length} listings to eBay`);
    setSelectedListings([]);
    setIsPublishing(false);
    setPublishProgress(0);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCondition = filterCondition === 'all' || 
                            listing.condition.includes(filterCondition);
    
    const matchesDemand = filterDemand === 'all' || 
                         listing.marketDemand === filterDemand;

    return matchesSearch && matchesCondition && matchesDemand;
  });

  const readyToPublishCount = filteredListings.filter(l => l.readyToPublish).length;
  const totalValue = selectedListings.reduce((sum, id) => {
    const listing = listings.find(l => l.id === id);
    return sum + (listing?.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Bulk Publish</h1>
          <p className="text-gray-600">Publish multiple listings to eBay at once</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
              
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger className="w-full sm:w-48 rounded-lg">
                  <SelectValue placeholder="Filter by condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="oem">OEM</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="refurbished">Refurbished</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDemand} onValueChange={setFilterDemand}>
                <SelectTrigger className="w-full sm:w-48 rounded-lg">
                  <SelectValue placeholder="Filter by demand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Demand</SelectItem>
                  <SelectItem value="high">High Demand</SelectItem>
                  <SelectItem value="medium">Medium Demand</SelectItem>
                  <SelectItem value="low">Low Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedListings.length > 0 && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="space-y-1">
                <p className="font-medium">
                  {selectedListings.length} listing{selectedListings.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-gray-600">
                  Total value: <span className="font-medium text-green-600">${totalValue.toFixed(2)}</span>
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedListings([])}
                  disabled={isPublishing}
                >
                  Clear Selection
                </Button>
                <Button 
                  onClick={handleBulkPublish}
                  disabled={isPublishing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPublishing ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Publish to eBay
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isPublishing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Publishing progress</span>
                  <span>{publishProgress}%</span>
                </div>
                <Progress value={publishProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredListings.length}</p>
              <p className="text-sm text-gray-600">Total Listings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{readyToPublishCount}</p>
              <p className="text-sm text-gray-600">Ready to Publish</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{selectedListings.length}</p>
              <p className="text-sm text-gray-600">Selected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredListings.reduce((sum, l) => sum + l.estimatedViews, 0)}
              </p>
              <p className="text-sm text-gray-600">Est. Total Views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ready Listings</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedListings.length === readyToPublishCount && readyToPublishCount > 0}
                onCheckedChange={handleSelectAll}
                disabled={readyToPublishCount === 0}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {filteredListings.map((listing) => (
              <div 
                key={listing.id} 
                className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                  selectedListings.includes(listing.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedListings.includes(listing.id)}
                    onCheckedChange={() => handleSelectListing(listing.id)}
                    disabled={!listing.readyToPublish || isPublishing}
                  />

                  {/* Image */}
                  <div className="flex-shrink-0">
                    <ImageWithFallback
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium truncate">{listing.title}</h3>
                        <p className="text-sm text-gray-600">Part #: {listing.partNumber}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getDemandColor(listing.marketDemand)} variant="secondary">
                            {listing.marketDemand} demand
                          </Badge>
                          {!listing.readyToPublish && (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Issues Found
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right space-y-1">
                        <p className="font-semibold text-green-600">${listing.price}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Eye className="h-3 w-3" />
                          {listing.estimatedViews} views/month
                        </div>
                        <p className="text-xs text-gray-500">
                          {listing.completionStatus}% complete
                        </p>
                      </div>
                    </div>

                    {/* Compatibility */}
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Fits: {listing.compatibility.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {listing.readyToPublish ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredListings.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Package className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No listings found</h3>
                <p className="text-gray-600">
                  Try adjusting your filters or create more listings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}