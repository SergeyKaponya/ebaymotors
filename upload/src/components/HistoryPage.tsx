import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Eye,
  MessageSquare,
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Download,
  RefreshCw,
  Clock
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface PublishedListing {
  id: string;
  title: string;
  partNumber: string;
  images: string[];
  price: number;
  publishedDate: Date;
  platform: 'ebay' | 'facebook' | 'craigslist';
  status: 'active' | 'sold' | 'ended' | 'paused';
  views: number;
  watchers: number;
  questions: number;
  offers: number;
  daysListed: number;
  lastActivity: Date;
  ebayUrl?: string;
  soldPrice?: number;
  soldDate?: Date;
}

export function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Mock published listings data
  const [listings] = useState<PublishedListing[]>([
    {
      id: '1',
      title: '2018-2022 Chevrolet Equinox Brake Caliper Assembly',
      partNumber: 'GM-45123-789',
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=200&fit=crop'],
      price: 89.99,
      publishedDate: new Date('2024-01-10'),
      platform: 'ebay',
      status: 'sold',
      views: 156,
      watchers: 8,
      questions: 3,
      offers: 2,
      daysListed: 5,
      lastActivity: new Date('2024-01-15'),
      ebayUrl: 'https://ebay.com/itm/123456789',
      soldPrice: 85.00,
      soldDate: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Ford F-150 Headlight Assembly LED',
      partNumber: 'FRD-HDL-456',
      images: ['https://images.unsplash.com/photo-1609044702684-eed8eb26ba00?w=200&h=200&fit=crop'],
      price: 189.50,
      publishedDate: new Date('2024-01-08'),
      platform: 'ebay',
      status: 'active',
      views: 243,
      watchers: 12,
      questions: 5,
      offers: 1,
      daysListed: 7,
      lastActivity: new Date('2024-01-14'),
      ebayUrl: 'https://ebay.com/itm/123456790'
    },
    {
      id: '3',
      title: 'Honda Civic Front Bumper Cover',
      partNumber: 'HON-BMP-789',
      images: ['https://images.unsplash.com/photo-1572142844095-e432b4ca5a8d?w=200&h=200&fit=crop'],
      price: 245.00,
      publishedDate: new Date('2024-01-05'),
      platform: 'facebook',
      status: 'active',
      views: 89,
      watchers: 4,
      questions: 2,
      offers: 0,
      daysListed: 10,
      lastActivity: new Date('2024-01-13')
    },
    {
      id: '4',
      title: 'Toyota Camry Side Mirror Power',
      partNumber: 'TOY-MIR-321',
      images: ['https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=200&h=200&fit=crop'],
      price: 75.99,
      publishedDate: new Date('2024-01-01'),
      platform: 'ebay',
      status: 'ended',
      views: 67,
      watchers: 2,
      questions: 1,
      offers: 0,
      daysListed: 14,
      lastActivity: new Date('2024-01-14'),
      ebayUrl: 'https://ebay.com/itm/123456791'
    },
    {
      id: '5',
      title: 'BMW 3 Series Door Handle Chrome',
      partNumber: 'BMW-DH-123',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=200&fit=crop'],
      price: 67.99,
      publishedDate: new Date('2023-12-28'),
      platform: 'ebay',
      status: 'paused',
      views: 34,
      watchers: 1,
      questions: 0,
      offers: 0,
      daysListed: 18,
      lastActivity: new Date('2024-01-12'),
      ebayUrl: 'https://ebay.com/itm/123456792'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'sold': return 'bg-blue-100 text-blue-700';
      case 'ended': return 'bg-gray-100 text-gray-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'ebay': return 'bg-blue-100 text-blue-700';
      case 'facebook': return 'bg-blue-100 text-blue-700';
      case 'craigslist': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    const matchesPlatform = filterPlatform === 'all' || listing.platform === filterPlatform;
    
    if (activeTab === 'active') return matchesSearch && listing.status === 'active' && matchesStatus && matchesPlatform;
    if (activeTab === 'sold') return matchesSearch && listing.status === 'sold' && matchesStatus && matchesPlatform;
    if (activeTab === 'ended') return matchesSearch && (listing.status === 'ended' || listing.status === 'paused') && matchesStatus && matchesPlatform;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    sold: listings.filter(l => l.status === 'sold').length,
    totalRevenue: listings.filter(l => l.status === 'sold').reduce((sum, l) => sum + (l.soldPrice || 0), 0),
    totalViews: listings.reduce((sum, l) => sum + l.views, 0),
    avgDaysToSell: listings.filter(l => l.status === 'sold').reduce((sum, l) => sum + l.daysListed, 0) / listings.filter(l => l.status === 'sold').length || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Listing History</h1>
          <p className="text-gray-600">Track your published listings and performance</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.sold}</p>
              <p className="text-sm text-gray-600">Items Sold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.avgDaysToSell.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg Days to Sell</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="ebay">eBay</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="craigslist">Craigslist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="sold">Sold ({stats.sold})</TabsTrigger>
              <TabsTrigger value="ended">Ended ({listings.length - stats.active - stats.sold})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="space-y-1">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <ImageWithFallback
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium truncate">{listing.title}</h3>
                        <p className="text-sm text-gray-600">Part #: {listing.partNumber}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ${listing.status === 'sold' ? listing.soldPrice : listing.price}
                          {listing.status === 'sold' && listing.soldPrice !== listing.price && (
                            <span className="text-sm text-gray-500 line-through ml-1">
                              ${listing.price}
                            </span>
                          )}
                        </p>
                        {listing.status === 'sold' && (
                          <p className="text-xs text-gray-500">
                            Sold {listing.soldDate?.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status and Platform Badges */}
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(listing.status)} variant="secondary">
                        {listing.status.toUpperCase()}
                      </Badge>
                      <Badge className={getPlatformColor(listing.platform)} variant="outline">
                        {listing.platform.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Listed {listing.daysListed} days ago
                      </span>
                    </div>

                    {/* Performance Metrics */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {listing.views} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {listing.watchers} watchers
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {listing.questions} questions
                      </div>
                      {listing.offers > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {listing.offers} offers
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {listing.publishedDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {listing.ebayUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(listing.ebayUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
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
              <Clock className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No listings found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'You haven\'t published any listings yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}