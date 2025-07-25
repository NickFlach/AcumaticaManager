import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExcelUtils } from "@/lib/excel-utils";
import type { ExcelImportResult } from "@/types";

export default function ExcelImport() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importTypes = [
    {
      value: 'projects',
      label: 'Projects',
      description: 'Import project data including budgets and client information',
      icon: FileSpreadsheet,
      templateFields: ['Project Code', 'Project Name', 'Client Name', 'Budget Amount', 'Due Date']
    },
    {
      value: 'tasks',
      label: 'Tasks',
      description: 'Import tasks with hierarchy and assignments',
      icon: FileText,
      templateFields: ['Task Name', 'Project ID', 'Parent Task ID', 'Estimated Hours', 'Due Date']
    },
    {
      value: 'time-entries',
      label: 'Time Entries',
      description: 'Import labor hours and time tracking data',
      icon: FileSpreadsheet,
      templateFields: ['Project ID', 'User ID', 'Date', 'Hours', 'Description']
    },
    {
      value: 'rfis',
      label: 'RFIs',
      description: 'Import Request for Information records',
      icon: FileText,
      templateFields: ['RFI Number', 'Project ID', 'Title', 'Description', 'Priority']
    },
    {
      value: 'change-orders',
      label: 'Change Orders',
      description: 'Import change order requests and approvals',
      icon: FileSpreadsheet,
      templateFields: ['CO Number', 'Project ID', 'Title', 'Cost Impact', 'Type']
    },
    {
      value: 'risks',
      label: 'Risks',
      description: 'Import risk assessments and mitigation plans',
      icon: FileText,
      templateFields: ['Risk Title', 'Project ID', 'Probability', 'Impact', 'Category']
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile || !selectedType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and import type",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await ExcelUtils.importFromExcel(importFile, selectedType);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.recordsImported} records successfully`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: `Import failed with ${result.errors.length} errors`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "An unexpected error occurred during import",
        variant: "destructive",
      });
      setImportResult({
        success: false,
        recordsImported: 0,
        errors: ["Unexpected error occurred"],
        warnings: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (type: string) => {
    const selectedImportType = importTypes.find(t => t.value === type);
    if (!selectedImportType) return;

    // Create a simple template with headers
    const templateData = [selectedImportType.templateFields.reduce((acc, field) => {
      acc[field] = '';
      return acc;
    }, {} as any)];

    ExcelUtils.exportToExcel(templateData, `${type}-template.xlsx`, 'Template');
    
    toast({
      title: "Template Downloaded",
      description: `${selectedImportType.label} template has been downloaded`,
    });
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setSelectedType("");
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Import Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {importTypes.map((type) => (
              <div
                key={type.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedType === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedType(type.value)}
              >
                <div className="flex items-start space-x-3">
                  <type.icon 
                    size={24} 
                    className={selectedType === type.value ? 'text-primary' : 'text-gray-500'}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(type.value);
                        }}
                      >
                        <Download size={16} className="mr-2" />
                        Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                importFile 
                  ? 'border-secondary bg-secondary/10' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-4">
                  {importFile ? (
                    <>
                      <CheckCircle size={48} className="mx-auto text-secondary" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{importFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(importFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={48} className="mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          Drop your Excel file here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports .xlsx and .xls files up to 10MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleImport}
                  disabled={!importFile || !selectedType || isImporting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isImporting ? 'Importing...' : 'Import Data'}
                </Button>
                
                {(importFile || importResult) && (
                  <Button variant="outline" onClick={resetImport}>
                    Reset
                  </Button>
                )}
              </div>

              {selectedType && (
                <div className="text-sm text-gray-600">
                  Importing: <span className="font-semibold">
                    {importTypes.find(t => t.value === selectedType)?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {importResult.success ? (
                <CheckCircle className="text-secondary" size={24} />
              ) : (
                <XCircle className="text-destructive" size={24} />
              )}
              <span>Import Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">
                    {importResult.recordsImported}
                  </div>
                  <div className="text-sm text-gray-600">Records Imported</div>
                </div>
                
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {importResult.errors.length}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <div className="text-2xl font-bold text-warning">
                    {importResult.warnings.length}
                  </div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">Errors:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">Warnings:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {importResult.warnings.slice(0, 5).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                        {importResult.warnings.length > 5 && (
                          <li>... and {importResult.warnings.length - 5} more warnings</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {importResult.success && importResult.errors.length === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed successfully! All {importResult.recordsImported} records were imported without errors.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Import Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">File Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Excel format (.xlsx or .xls)</li>
                <li>• Maximum file size: 10MB</li>
                <li>• First row must contain column headers</li>
                <li>• No empty rows between data</li>
                <li>• Use the provided templates for best results</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Data Format</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Dates: MM/DD/YYYY format</li>
                <li>• Numbers: No currency symbols or commas</li>
                <li>• Required fields must not be empty</li>
                <li>• Project codes must be unique</li>
                <li>• Task hierarchy supported via parent IDs</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <FileSpreadsheet className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-blue-800">Union Electrical Contractor Support</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Our import system supports specialized fields for union electrical contractors, 
                  including labor classifications, certification requirements, and prevailing wage rates.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
