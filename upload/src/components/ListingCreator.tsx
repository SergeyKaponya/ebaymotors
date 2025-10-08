import React, { useState, useRef } from 'react';
import { analyzeOCR, generateListing, saveDraft } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Switch } from './ui/switch';
import { 
  Upload, 
  Camera, 
  Scan, 
  Plus, 
  X, 
  Wand2, 
  ExternalLink, 
  CheckCircle,
  AlertTriangle,
  Copy,
  ShoppingCart,
  FileText,
  Download,
  Loader2,
  ChevronDown,
  Truck,
  DollarSign
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface CompatibilityItem {
  id: string;
  year: string;
  make: string;
  model: string;
  verified: boolean;
  source?: string;
  sourceUrl?: string;
}

interface OCRData {
  partNumber: string;
  vehicleInfo: string;
  rawText: string;
  detectedTexts: string[];
  confidence: number;
  processingComplete: boolean;
}

interface AISuggestions {
  title: string;
  description: string;
  isGenerating: boolean;
}

export function ListingCreator() {
  // Keep both preview URLs and original File objects
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [condition, setCondition] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [priceWithDelivery, setPriceWithDelivery] = useState('');
  const [freeDelivery, setFreeDelivery] = useState(false);
  
  // Source Vehicle Information
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  
  // Delivery Options
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [shippingCost, setShippingCost] = useState('');
  const [handlingTime, setHandlingTime] = useState('1');
  const [domesticShipping, setDomesticShipping] = useState(true);
  const [internationalShipping, setInternationalShipping] = useState(false);
  
  // Additional Part Details (eBay Motors)
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [manufacturerPartNumber, setManufacturerPartNumber] = useState('');
  const [interchangePartNumber, setInterchangePartNumber] = useState('');
  const [oeoemNumber, setOeoemNumber] = useState('');
  const [partBrand, setPartBrand] = useState('');
  const [placement, setPlacement] = useState('');
  const [warrantyDuration, setWarrantyDuration] = useState('');
  const [warrantyType, setWarrantyType] = useState('');
  const [surfaceFinish, setSurfaceFinish] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [countryManufacture, setCountryManufacture] = useState('');
  const [fitmentType, setFitmentType] = useState('');
  
  const [ocrData, setOcrData] = useState<OCRData>({
    partNumber: '',
    vehicleInfo: '',
    rawText: '',
    detectedTexts: [],
    confidence: 0,
    processingComplete: false
  });
  
  const [aiSuggestions, setAISuggestions] = useState<AISuggestions>({
    title: '',
    description: '',
    isGenerating: false
  });
  
  const [compatibility, setCompatibility] = useState<CompatibilityItem[]>([]);
  const [newCompat, setNewCompat] = useState({ year: '', make: '', model: '' });
  const [isValidatingCompat, setIsValidatingCompat] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 20;
  const initialDisplaySlots = 8;

  const triggerOCRAnalysis = async (filesToAnalyze: File[]) => {
    if (!filesToAnalyze.length) return;
    setOcrData(prev => ({
      ...prev,
      processingComplete: false,
      detectedTexts: [],
      rawText: prev.rawText,
      confidence: 0
    }));
    try {
      const resp = await analyzeOCR(filesToAnalyze);
      if (!resp.ok) throw new Error(resp.error || 'Failed to analyze images');
      const data = resp.ocr || {};
      setOcrData({
        partNumber: data.partNumber || '',
        vehicleInfo: data.vehicleInfo || '',
        rawText: data.rawText || '',
        detectedTexts: data.detectedTexts || [],
        confidence: data.confidence || 0,
        processingComplete: true
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'OCR processing failed');
      setOcrData(prev => ({
        ...prev,
        processingComplete: true
      }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const remainingSlots = maxImages - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newImages = filesToProcess.map(file => URL.createObjectURL(file));
      const updatedImages = [...images, ...newImages];
      const updatedFiles = [...imageFiles, ...filesToProcess];
      setImages(updatedImages);
      setImageFiles(updatedFiles);

      await triggerOCRAnalysis(updatedFiles);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateAISuggestions = async () => {
    if (imageFiles.length === 0) {
      toast.error('Upload at least one image to run OCR/AI');
      return;
    }
    setAISuggestions(prev => ({ ...prev, isGenerating: true }));
    try {
      const vehicle = (vehicleMake || vehicleModel || vehicleYear || vinNumber) ? {
        make: vehicleMake || undefined,
        model: vehicleModel || undefined,
        year: vehicleYear || undefined,
        vin: vinNumber || undefined
      } : undefined;
      const resp = await generateListing({
        images: imageFiles,
        vehicle,
        partNumber: partNumber || undefined,
        existingCompatibility: compatibility
      });
      if (!resp.ok) throw new Error(resp.error || 'Generation failed');

      // OCR
      if (resp.ocr) {
        setOcrData({
          partNumber: resp.ocr.partNumber || ocrData.partNumber,
          vehicleInfo: resp.ocr.vehicleInfo || ocrData.vehicleInfo,
          rawText: resp.ocr.rawText || ocrData.rawText,
          detectedTexts: resp.ocr.detectedTexts || resp.ocr.textCandidates || ocrData.detectedTexts || [],
          confidence: resp.ocr.confidence || ocrData.confidence,
          processingComplete: true
        });
        if (!partNumber && resp.inferredPartNumber) setPartNumber(resp.inferredPartNumber);
      }

      if (resp.ai) {
        setAISuggestions({
          title: resp.ai.title || '',
          description: resp.ai.description || '',
          isGenerating: false
        });
      } else {
        setAISuggestions(prev => ({ ...prev, isGenerating: false }));
      }

      if (resp.compatibility && resp.compatibility.length) {
        // Merge without duplicates by year/make/model
        setCompatibility(prev => {
          const map = new Map(prev.map(c => [c.year + c.make + c.model, c]));
          resp.compatibility.forEach((c: any) => {
            const key = c.year + c.make + c.model;
            if (!map.has(key)) map.set(key, {
              id: c.id || Date.now().toString() + Math.random(),
              year: c.year,
              make: c.make,
              model: c.model,
              verified: !!c.verified,
              source: c.source,
              sourceUrl: c.sourceUrl
            });
          });
          return Array.from(map.values());
        });
      }

      toast.success('AI suggestions generated');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate suggestions');
      setAISuggestions(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const applyAISuggestions = () => {
    if (aiSuggestions.title) setTitle(aiSuggestions.title);
    if (aiSuggestions.description) setDescription(aiSuggestions.description);
    toast.success('AI suggestions applied');
  };

  const applyOCRData = () => {
    if (ocrData.partNumber && !partNumber) {
      setPartNumber(ocrData.partNumber);
    }
    if (ocrData.vehicleInfo && compatibility.length === 0) {
      // Parse vehicle info and add to compatibility
      const parts = ocrData.vehicleInfo.split(' ');
      if (parts.length >= 3) {
        const yearRange = parts[0];
        const make = parts[1];
        const model = parts.slice(2).join(' ');
        
        const newItem: CompatibilityItem = {
          id: Date.now().toString(),
          year: yearRange,
          make: make,
          model: model,
          verified: false
        };
        setCompatibility([newItem]);
      }
    }
    toast.success('OCR data applied');
  };

  const validateCompatibility = async (item: CompatibilityItem) => {
    setIsValidatingCompat(true);
    
    // Simulate validation API call
    setTimeout(() => {
      const updatedItem: CompatibilityItem = {
        ...item,
        verified: Math.random() > 0.3, // 70% success rate
        source: 'AutoZone Parts Database',
        sourceUrl: 'https://autozone.com/parts/brake-calipers'
      };
      
      setCompatibility(prev => 
        prev.map(comp => comp.id === item.id ? updatedItem : comp)
      );
      setIsValidatingCompat(false);
      
      if (updatedItem.verified) {
        toast.success('Compatibility verified');
      } else {
        toast.warning('Could not verify compatibility');
      }
    }, 2000);
  };

  const addCompatibility = () => {
    if (newCompat.year && newCompat.make && newCompat.model) {
      const newItem: CompatibilityItem = {
        id: Date.now().toString(),
        ...newCompat,
        verified: false
      };
      setCompatibility(prev => [...prev, newItem]);
      setNewCompat({ year: '', make: '', model: '' });
    }
  };

  const removeCompatibility = (id: string) => {
    setCompatibility(prev => prev.filter(item => item.id !== id));
  };

  const handleConditionChange = (conditionType: string, checked: boolean) => {
    if (checked) {
      setCondition(prev => [...prev, conditionType]);
    } else {
      setCondition(prev => prev.filter(c => c !== conditionType));
    }
  };

  const copyToClipboard = () => {
    const listingText = `
Title: ${title}
Part Number: ${partNumber}
Condition: ${condition.join(', ')}
Price: ${price}

Source Vehicle:
${vehicleMake ? `Make: ${vehicleMake}` : ''}
${vehicleModel ? `Model: ${vehicleModel}` : ''}
${vehicleYear ? `Year: ${vehicleYear}` : ''}
${vinNumber ? `VIN: ${vinNumber}` : ''}

Description:
${description}

Compatibility:
${compatibility.map(c => `- ${c.year} ${c.make} ${c.model}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(listingText);
    toast.success('Listing copied to clipboard');
  };

  const exportToEbay = () => {
    toast.success('Redirecting to eBay listing tool...');
    // In real app, this would open eBay's listing API or redirect
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const draftPayload = {
        id: draftId || undefined,
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        priceWithDelivery: priceWithDelivery ? parseFloat(priceWithDelivery) : undefined,
        freeDelivery,
        shipping: {
          method: shippingMethod,
          cost: shippingCost ? parseFloat(shippingCost) : undefined,
          handlingTimeDays: handlingTime ? parseInt(handlingTime) : undefined,
          domestic: domesticShipping,
          international: internationalShipping
        },
        part: {
          partNumber,
          conditionTags: condition,
          manufacturerPartNumber,
          interchangePartNumber,
          oeOemNumber: oeoemNumber,
          brand: partBrand,
          placement,
          fitmentType,
          warrantyDuration,
          warrantyType,
          surfaceFinish,
          color,
          material,
          countryManufacture
        },
        ocr: ocrData.processingComplete ? {
          partNumber: ocrData.partNumber,
          vehicleInfo: ocrData.vehicleInfo,
          rawText: ocrData.rawText,
          detectedTexts: ocrData.detectedTexts,
          confidence: ocrData.confidence
        } : undefined,
        ai: aiSuggestions.title || aiSuggestions.description ? {
          title: aiSuggestions.title,
          description: aiSuggestions.description
        } : undefined,
        compatibility,
        vehicleSnapshot: (vehicleMake || vehicleModel || vehicleYear || vinNumber) ? {
          id: 'temp',
          make: vehicleMake,
          model: vehicleModel,
          year: vehicleYear ? parseInt(vehicleYear) : undefined,
          vin: vinNumber,
          createdAt: '',
          updatedAt: ''
        } : undefined
      };

      const saved = await saveDraft(draftPayload);
      if (saved.id) setDraftId(saved.id);
      toast.success('Draft saved');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Source Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Source Vehicle Information</CardTitle>
          <p className="text-sm text-gray-600">Details about the vehicle this part was removed from</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleMake">Make</Label>
              <Input
                id="vehicleMake"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="e.g., Honda, Toyota, Ford"
                className="rounded-lg"
              />
            </div>
            
            <div>
              <Label htmlFor="vehicleModel">Model</Label>
              <Input
                id="vehicleModel"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g., Civic, Camry, F-150"
                className="rounded-lg"
              />
            </div>
            
            <div>
              <Label htmlFor="vehicleYear">Year of Manufacture</Label>
              <Input
                id="vehicleYear"
                type="number"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                placeholder="e.g., 2018"
                className="rounded-lg"
              />
            </div>
            
            <div>
              <Label htmlFor="vinNumber">VIN Number</Label>
              <Input
                id="vinNumber"
                value={vinNumber}
                onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                placeholder="e.g., 1HGBH41JXMN109186"
                className="rounded-lg font-mono"
                maxLength={17}
              />
              {vinNumber && vinNumber.length !== 17 && vinNumber.length > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  VIN should be 17 characters ({vinNumber.length}/17)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Image Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Part Images ({images.length}/{maxImages})
            </div>
            {images.length > 0 && (
              <Badge variant="outline">{images.length} uploaded</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Image Grid with Upload Slots */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Uploaded Images */}
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                  <ImageWithFallback
                    src={image}
                    alt={`Part image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {index === 0 ? 'Main' : index + 1}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {/* Empty Upload Slots - Show initial 8 or expand based on uploaded count */}
              {(() => {
                const emptySlots = images.length < initialDisplaySlots 
                  ? initialDisplaySlots - images.length 
                  : Math.min(4, maxImages - images.length);
                
                return Array.from({ length: emptySlots }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                      index === 0 && images.length < maxImages
                        ? 'border-blue-300 bg-blue-50 cursor-pointer hover:border-blue-400 hover:bg-blue-100'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    onClick={index === 0 && images.length < maxImages ? () => fileInputRef.current?.click() : undefined}
                  >
                    <Upload className={`h-6 w-6 mb-1 ${index === 0 ? 'text-blue-500' : 'text-gray-300'}`} />
                    <span className={`text-xs ${index === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {index === 0 && images.length < maxImages ? 'Add Image' : ''}
                    </span>
                  </div>
                ));
              })()}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Upload up to {maxImages} images. First image will be the main listing photo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced OCR Results */}
      {images.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Scan className="h-5 w-5" />
              OCR Analysis
              {!ocrData.processingComplete && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!ocrData.processingComplete ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">Processing images...</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            ) : (
              <Tabs defaultValue="structured" className="w-full">
                <div className="flex justify-between items-center mb-3">
                  <TabsList className="bg-white/70">
                    <TabsTrigger value="structured">Structured Data</TabsTrigger>
                    <TabsTrigger value="raw">Raw Text</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {ocrData.confidence}% Confidence
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={applyOCRData}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply Data
                    </Button>
                  </div>
                </div>

                <TabsContent value="structured" className="space-y-3">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-blue-700">Part Number</Label>
                      <p className="text-sm font-mono bg-white p-3 rounded-lg border">
                        {ocrData.partNumber || 'Not detected'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-blue-700">Detected Text</Label>
                      <div className="bg-white p-3 rounded-lg border max-h-40 overflow-y-auto space-y-2">
                        {ocrData.detectedTexts.length ? (
                          ocrData.detectedTexts.map((text, index) => (
                            <p key={`${text}-${index}`} className="text-sm font-mono whitespace-pre-wrap">
                              {text}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No text detected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="raw" className="space-y-3">
                  <div>
                    <Label className="text-blue-700">Raw OCR Text</Label>
                    <div className="bg-white p-3 rounded-lg border max-h-32 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {ocrData.rawText || 'No text detected'}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI-Enhanced Part Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Part Information</span>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAISuggestions}
              disabled={aiSuggestions.isGenerating}
              className="flex items-center gap-2"
            >
              {aiSuggestions.isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generate AI Suggestions
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Suggestions Preview */}
          {(aiSuggestions.title || aiSuggestions.description) && (
            <div className="bg-purple-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-purple-700 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  AI Suggestions
                </Label>
                <Button
                  size="sm"
                  onClick={applyAISuggestions}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Apply Suggestions
                </Button>
              </div>
              {aiSuggestions.title && (
                <div>
                  <Label className="text-sm text-purple-600">Suggested Title:</Label>
                  <p className="text-sm bg-white p-2 rounded border">
                    {aiSuggestions.title}
                  </p>
                </div>
              )}
              {aiSuggestions.description && (
                <div>
                  <Label className="text-sm text-purple-600">Suggested Description:</Label>
                  <p className="text-sm bg-white p-2 rounded border max-h-20 overflow-y-auto">
                    {aiSuggestions.description}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Listing Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Honda Civic Brake Caliper - Front Left"
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g., ABC-123-456"
                  className="rounded-lg font-mono"
                />
              </div>

              {/* Pricing Section */}
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-700" />
                  <Label className="text-green-700">Pricing</Label>
                </div>
                
                <div>
                  <Label htmlFor="price">Base Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="rounded-lg pl-8"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                  <Switch
                    id="freeDelivery"
                    checked={freeDelivery}
                    onCheckedChange={setFreeDelivery}
                  />
                  <Label htmlFor="freeDelivery" className="text-sm cursor-pointer">
                    Free Delivery
                  </Label>
                </div>

                {!freeDelivery && (
                  <div>
                    <Label htmlFor="priceWithDelivery">Price with Delivery</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="priceWithDelivery"
                        type="number"
                        value={priceWithDelivery}
                        onChange={(e) => setPriceWithDelivery(e.target.value)}
                        placeholder="0.00"
                        className="rounded-lg pl-8"
                      />
                    </div>
                    {price && priceWithDelivery && (
                      <p className="text-xs text-gray-600 mt-1">
                        Delivery cost: ${(parseFloat(priceWithDelivery) - parseFloat(price)).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Condition</Label>
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                {[
                  { id: 'oem', label: 'OEM (Original Equipment)' },
                  { id: 'used', label: 'Used - Good Condition' },
                  { id: 'refurbished', label: 'Refurbished/Rebuilt' },
                  { id: 'new', label: 'New Aftermarket' },
                  { id: 'salvage', label: 'Salvage/For Parts' }
                ].map((conditionType) => (
                  <div key={conditionType.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={conditionType.id}
                      checked={condition.includes(conditionType.id)}
                      onCheckedChange={(checked) => 
                        handleConditionChange(conditionType.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={conditionType.id} className="text-sm">
                      {conditionType.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the condition, installation details, and any relevant information..."
              className="rounded-lg min-h-[120px]"
            />
          </div>

          <Separator className="my-4" />

          {/* Additional eBay Motors Details - Collapsible */}
          <Collapsible open={showAdditionalDetails} onOpenChange={setShowAdditionalDetails}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Additional eBay Motors Details (Optional)
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdditionalDetails ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                <p className="text-sm text-blue-700">
                  These fields are commonly used in eBay Motors listings and can improve searchability
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturerPartNumber">Manufacturer Part Number</Label>
                    <Input
                      id="manufacturerPartNumber"
                      value={manufacturerPartNumber}
                      onChange={(e) => setManufacturerPartNumber(e.target.value)}
                      placeholder="e.g., MPN-12345"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interchangePartNumber">Interchange Part Number</Label>
                    <Input
                      id="interchangePartNumber"
                      value={interchangePartNumber}
                      onChange={(e) => setInterchangePartNumber(e.target.value)}
                      placeholder="e.g., IPN-67890"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="oeoemNumber">OE/OEM Number</Label>
                    <Input
                      id="oeoemNumber"
                      value={oeoemNumber}
                      onChange={(e) => setOeoemNumber(e.target.value)}
                      placeholder="e.g., OEM-ABC123"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="partBrand">Part Brand/Manufacturer</Label>
                    <Input
                      id="partBrand"
                      value={partBrand}
                      onChange={(e) => setPartBrand(e.target.value)}
                      placeholder="e.g., ACDelco, Bosch, Motorcraft"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="placement">Placement on Vehicle</Label>
                    <Select value={placement} onValueChange={setPlacement}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select placement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front">Front</SelectItem>
                        <SelectItem value="rear">Rear</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="front-left">Front Left</SelectItem>
                        <SelectItem value="front-right">Front Right</SelectItem>
                        <SelectItem value="rear-left">Rear Left</SelectItem>
                        <SelectItem value="rear-right">Rear Right</SelectItem>
                        <SelectItem value="upper">Upper</SelectItem>
                        <SelectItem value="lower">Lower</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fitmentType">Fitment Type</Label>
                    <Select value={fitmentType} onValueChange={setFitmentType}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select fitment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct Fit</SelectItem>
                        <SelectItem value="universal">Universal Fit</SelectItem>
                        <SelectItem value="performance">Performance/Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="warrantyDuration">Warranty Duration</Label>
                    <Input
                      id="warrantyDuration"
                      value={warrantyDuration}
                      onChange={(e) => setWarrantyDuration(e.target.value)}
                      placeholder="e.g., 12 months, 2 years"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="warrantyType">Warranty Type</Label>
                    <Select value={warrantyType} onValueChange={setWarrantyType}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select warranty type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                        <SelectItem value="dealer">Dealer Warranty</SelectItem>
                        <SelectItem value="limited">Limited Warranty</SelectItem>
                        <SelectItem value="lifetime">Lifetime Warranty</SelectItem>
                        <SelectItem value="none">No Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="surfaceFinish">Surface Finish</Label>
                    <Input
                      id="surfaceFinish"
                      value={surfaceFinish}
                      onChange={(e) => setSurfaceFinish(e.target.value)}
                      placeholder="e.g., Painted, Chrome, Powder Coated"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g., Black, Silver, Red"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g., Steel, Aluminum, Plastic"
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="countryManufacture">Country of Manufacture</Label>
                    <Input
                      id="countryManufacture"
                      value={countryManufacture}
                      onChange={(e) => setCountryManufacture(e.target.value)}
                      placeholder="e.g., USA, Germany, Japan"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingMethod">Shipping Method</Label>
              <Select value={shippingMethod} onValueChange={setShippingMethod}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select shipping method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Shipping</SelectItem>
                  <SelectItem value="expedited">Expedited Shipping</SelectItem>
                  <SelectItem value="overnight">Overnight Shipping</SelectItem>
                  <SelectItem value="freight">Freight Shipping</SelectItem>
                  <SelectItem value="local-pickup">Local Pickup Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shippingCost">Shipping Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="shippingCost"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0.00"
                  className="rounded-lg pl-8"
                  disabled={freeDelivery}
                />
              </div>
              {freeDelivery && (
                <p className="text-xs text-green-600 mt-1">
                  Free delivery is enabled
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="handlingTime">Handling Time (Business Days)</Label>
              <Select value={handlingTime} onValueChange={setHandlingTime}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select handling time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 business day</SelectItem>
                  <SelectItem value="2">2 business days</SelectItem>
                  <SelectItem value="3">3 business days</SelectItem>
                  <SelectItem value="5">5 business days</SelectItem>
                  <SelectItem value="7">7 business days</SelectItem>
                  <SelectItem value="10">10 business days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Shipping Regions</Label>
              <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="domesticShipping"
                    checked={domesticShipping}
                    onCheckedChange={setDomesticShipping}
                  />
                  <Label htmlFor="domesticShipping" className="text-sm cursor-pointer">
                    Domestic Shipping
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="internationalShipping"
                    checked={internationalShipping}
                    onCheckedChange={setInternationalShipping}
                  />
                  <Label htmlFor="internationalShipping" className="text-sm cursor-pointer">
                    International Shipping
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {shippingMethod === 'local-pickup' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>Local Pickup Only:</strong> Buyers will need to arrange pickup at your location. 
                Make sure to specify your location details in the description.
              </p>
            </div>
          )}

          {internationalShipping && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>International Shipping:</strong> Additional customs forms and shipping costs may apply. 
                Consider specifying which countries you ship to in the description.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Vehicle Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vehicle Compatibility
            {isValidatingCompat && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Compatibility */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Year(s)"
              value={newCompat.year}
              onChange={(e) => setNewCompat(prev => ({ ...prev, year: e.target.value }))}
              className="rounded-lg"
            />
            <Input
              placeholder="Make"
              value={newCompat.make}
              onChange={(e) => setNewCompat(prev => ({ ...prev, make: e.target.value }))}
              className="rounded-lg"
            />
            <Input
              placeholder="Model"
              value={newCompat.model}
              onChange={(e) => setNewCompat(prev => ({ ...prev, model: e.target.value }))}
              className="rounded-lg"
            />
            <Button onClick={addCompatibility} className="rounded-lg">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Enhanced Compatibility List */}
          {compatibility.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                {compatibility.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {item.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="font-medium">
                          {item.year} {item.make} {item.model}
                        </span>
                      </div>
                      
                      {item.verified && item.source && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Verified
                          </Badge>
                          {item.sourceUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(item.sourceUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => validateCompatibility(item)}
                          disabled={isValidatingCompat}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-red-100"
                        onClick={() => removeCompatibility(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {compatibility.some(c => c.source) && (
                <div className="text-xs text-gray-500">
                  Compatibility verified against: {compatibility.find(c => c.source)?.source}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2"
            >
              {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {draftId ? 'Update Draft' : 'Save Draft'}
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Listing
            </Button>
            
            <Button
              onClick={exportToEbay}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Post to eBay
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => toast.info('Export to other platforms coming soon')}
            >
              <FileText className="h-4 w-4" />
              Export Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
