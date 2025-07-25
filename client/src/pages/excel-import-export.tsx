import { useState } from "react";
import Header from "@/components/layout/header";
import ExcelImport from "@/components/excel/excel-import";
import ExcelExport from "@/components/excel/excel-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Download, Upload, FileText } from "lucide-react";

export default function ExcelImportExport() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Excel Import/Export"
        subtitle="Import data from Excel files and export project data in Excel and MPP formats"
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Excel Compatible</p>
                  <p className="text-lg font-bold text-gray-900">100%</p>
                </div>
                <FileSpreadsheet className="w-12 h-12 text-secondary bg-secondary/10 p-2 rounded-lg" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Full compatibility with Excel formats
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">MPP Export</p>
                  <p className="text-lg font-bold text-gray-900">Ready</p>
                </div>
                <FileText className="w-12 h-12 text-primary bg-primary/10 p-2 rounded-lg" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Microsoft Project compatible format
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Batch Processing</p>
                  <p className="text-lg font-bold text-gray-900">Available</p>
                </div>
                <Upload className="w-12 h-12 text-warning bg-warning/10 p-2 rounded-lg" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Import multiple files at once
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList>
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <Upload size={16} />
              <span>Import Data</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download size={16} />
              <span>Export Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <ExcelImport />
          </TabsContent>

          <TabsContent value="export">
            <ExcelExport />
          </TabsContent>
        </Tabs>

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Excel Integration Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Import Guidelines</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use the provided templates for best results</li>
                  <li>• Ensure all required fields are populated</li>
                  <li>• Date formats should be MM/DD/YYYY</li>
                  <li>• Numeric values should not contain currency symbols</li>
                  <li>• Project codes must be unique across the system</li>
                  <li>• Task hierarchy is supported through parent task IDs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Export Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Export to Excel (.xlsx) format with formatting</li>
                  <li>• Microsoft Project (.mpp) compatible export</li>
                  <li>• Custom column selection and filtering</li>
                  <li>• Hierarchical task structure preservation</li>
                  <li>• Budget vs actual cost analysis</li>
                  <li>• Time tracking and labor hour reports</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <FileSpreadsheet className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-blue-800">Union Electrical Contractor Features</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Specialized templates and exports designed for union electrical contractors, 
                    including labor rate tracking, certification requirements, and industrial 
                    control system project templates.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
