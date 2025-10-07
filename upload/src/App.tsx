import React, { useState } from 'react';
import { ListingCreator } from './components/ListingCreator';
import { ListingSidebar } from './components/ListingSidebar';
import { DraftsPage } from './components/DraftsPage';
import { BulkPublishPage } from './components/BulkPublishPage';
import { HistoryPage } from './components/HistoryPage';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { 
  ArrowLeft, 
  Settings, 
  HelpCircle, 
  Plus,
  FileText,
  Upload,
  Clock,
  BarChart3,
  Bell
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

function App() {
  const [isFormValid, setIsFormValid] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const handleSave = () => {
    toast.success('Listing saved as draft', {
      description: 'You can continue editing or post to eBay when ready.'
    });
  };

  const handlePostToEbay = () => {
    toast.success('Posted to eBay successfully!', {
      description: 'Your listing is now live and visible to buyers.'
    });
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'create': return <Plus className="h-4 w-4" />;
      case 'drafts': return <FileText className="h-4 w-4" />;
      case 'bulk': return <Upload className="h-4 w-4" />;
      case 'history': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="font-semibold">Car Parts Listing Tool</h1>
                <p className="text-sm text-gray-600">Manage your automotive parts inventory</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:flex">
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </Badge>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="create" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                {getTabIcon('create')}
                <span className="hidden sm:inline">Create Listing</span>
                <span className="sm:hidden">Create</span>
              </TabsTrigger>
              <TabsTrigger 
                value="drafts" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                {getTabIcon('drafts')}
                <span className="hidden sm:inline">Drafts</span>
                <span className="sm:hidden">Drafts</span>
                <Badge variant="secondary" className="ml-1">4</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="bulk" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                {getTabIcon('bulk')}
                <span className="hidden sm:inline">Bulk Publish</span>
                <span className="sm:hidden">Bulk</span>
                <Badge variant="secondary" className="ml-1">3</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                {getTabIcon('history')}
                <span className="hidden sm:inline">History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="create" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form Area */}
              <div className="lg:col-span-2">
                <ListingCreator />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8">
                  <ListingSidebar 
                    onSave={handleSave}
                    onPostToEbay={handlePostToEbay}
                    isFormValid={isFormValid}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="mt-0">
            <DraftsPage />
          </TabsContent>

          <TabsContent value="bulk" className="mt-0">
            <BulkPublishPage />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryPage />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Action Bar - Only show on Create tab */}
      {activeTab === 'create' && (
        <>
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSave}
              >
                Save Draft
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handlePostToEbay}
                disabled={!isFormValid}
              >
                Post to eBay
              </Button>
            </div>
          </div>

          {/* Add bottom padding for mobile to prevent overlap with action bar */}
          <div className="lg:hidden h-20"></div>
        </>
      )}

      {/* Quick Action Buttons for other tabs */}
      {activeTab !== 'create' && (
        <div className="lg:hidden fixed bottom-6 right-6">
          <Button
            onClick={() => setActiveTab('create')}
            className="bg-blue-600 hover:bg-blue-700 rounded-full h-14 w-14 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;