import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { 
  Save, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Copy,
  FileDown,
  Zap,
  Camera,
  FileText
} from 'lucide-react';

interface ListingSidebarProps {
  onSave: () => void;
  onPostToEbay: () => void;
  isFormValid: boolean;
}

export function ListingSidebar({ onSave, onPostToEbay, isFormValid }: ListingSidebarProps) {
  const listingChecklist = [
    { item: 'Images uploaded', completed: true, icon: <Camera className="h-3 w-3" /> },
    { item: 'OCR processed', completed: true, icon: <Zap className="h-3 w-3" /> },
    { item: 'Title added', completed: true, icon: <FileText className="h-3 w-3" /> },
    { item: 'Part number', completed: true, icon: <FileText className="h-3 w-3" /> },
    { item: 'Condition selected', completed: true, icon: <CheckCircle className="h-3 w-3" /> },
    { item: 'Description', completed: false, icon: <FileText className="h-3 w-3" /> },
    { item: 'Compatibility verified', completed: true, icon: <CheckCircle className="h-3 w-3" /> },
    { item: 'Pricing set', completed: false, icon: <DollarSign className="h-3 w-3" /> }
  ];

  const completedItems = listingChecklist.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedItems / listingChecklist.length) * 100);
  
  const suggestedPrices = [
    { source: 'eBay Sold', price: 89.99, trend: 'up' },
    { source: 'Market Average', price: 95.00, trend: 'stable' },
    { source: 'Parts Catalog', price: 120.00, trend: 'down' }
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Button 
            onClick={onSave}
            className="w-full rounded-lg"
            variant="outline"
            disabled={!isFormValid}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          
          <Button 
            onClick={onPostToEbay}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
            disabled={!isFormValid || completionPercentage < 80}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Post to eBay
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="rounded-lg">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg">
              <FileDown className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Listing Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Completion</span>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <Separator />

          <div className="space-y-2">
            {listingChecklist.map((check, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {check.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <div className={`p-1 rounded ${check.completed ? 'bg-green-100' : 'bg-orange-100'}`}>
                    <div className={check.completed ? 'text-green-600' : 'text-orange-600'}>
                      {check.icon}
                    </div>
                  </div>
                </div>
                <span className={`text-sm ${check.completed ? 'text-green-700' : 'text-gray-600'}`}>
                  {check.item}
                </span>
              </div>
            ))}
          </div>

          {completionPercentage < 80 && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-700">
                Complete more fields to enable eBay posting
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Suggested Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedPrices.map((price, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{price.source}</p>
                <p className="text-lg font-bold text-green-600">${price.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp 
                  className={`h-4 w-4 ${
                    price.trend === 'up' ? 'text-green-500' : 
                    price.trend === 'down' ? 'text-red-500 rotate-180' : 
                    'text-gray-500'
                  }`} 
                />
              </div>
            </div>
          ))}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">Recommended Range</p>
            <p className="text-lg font-bold text-blue-700">$85 - $95</p>
            <p className="text-xs text-blue-600 mt-1">Based on recent sales and condition</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Similar parts sold</span>
            <Badge variant="secondary">127 this week</Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Avg. listing time</span>
            <Badge variant="secondary">3.2 days</Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Success rate</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              92%
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-700">
                💡 Tip: Add detailed condition notes to increase buyer confidence
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                🚀 OCR detected part details can boost listing accuracy by 40%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}