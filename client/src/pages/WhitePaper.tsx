import { FileText, Download, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WhitePaper() {
  const downloadWhitePaper = async () => {
    try {
      // Fetch the markdown content
      const response = await fetch('/ElectroProject-Pro-White-Paper.md');
      const markdown = await response.text();
      
      // Convert markdown to clean text (remove HTML and markdown syntax)
      const cleanText = markdown
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/#{1,6}\s/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
        .replace(/`(.*?)`/g, '$1') // Remove code backticks
        .replace(/\n{3,}/g, '\n\n'); // Normalize line breaks
      
      // Create a blob with the clean text content
      const blob = new Blob([cleanText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ElectroProject-Pro-White-Paper.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading white paper:', error);
      // Fallback to original method if conversion fails
      const link = document.createElement('a');
      link.href = '/ElectroProject-Pro-White-Paper.md';
      link.download = 'ElectroProject-Pro-White-Paper.md';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="title-white-paper">
          ElectroProject Pro White Paper
        </h1>
        <p className="text-lg text-gray-600">
          Transforming Electrical Project Management with Modern Technology Solutions
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Comprehensive Industry Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                A detailed examination of how ElectroProject Pro addresses critical challenges 
                in electrical contracting through purpose-built project management solutions.
              </CardDescription>
            </div>
            <Button 
              onClick={downloadWhitePaper}
              className="flex items-center gap-2"
              data-testid="button-download-white-paper"
            >
              <Download className="h-4 w-4" />
              Download White Paper
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What's Inside</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Industry challenges and digital transformation needs
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Comprehensive solution overview and features
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Real-world implementation case studies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  ROI analysis and quantifiable benefits
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Technical architecture and security framework
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Implementation strategy and best practices
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Document Details</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Published: September 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Author: ElectroProject Pro Team</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>Format: Clean Text (TXT)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-gray-400" />
                  <span>Size: ~45 pages</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 30-40% reduction in project management overhead</li>
              <li>• 25% improvement in project delivery times</li>
              <li>• 50% reduction in administrative errors</li>
              <li>• Enhanced compliance and documentation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Electrical contractors and project managers</li>
              <li>• Construction technology decision makers</li>
              <li>• Operations directors and executives</li>
              <li>• IT professionals in construction</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Topics Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Industry transformation challenges</li>
              <li>• Purpose-built solution features</li>
              <li>• Implementation case studies</li>
              <li>• ROI analysis and metrics</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Transform Your Electrical Project Management?
            </h3>
            <p className="text-gray-600 mb-4">
              Download our comprehensive white paper to learn how ElectroProject Pro 
              can revolutionize your electrical contracting operations.
            </p>
            <Button 
              onClick={downloadWhitePaper} 
              size="lg"
              className="flex items-center gap-2"
              data-testid="button-download-white-paper-cta"
            >
              <Download className="h-5 w-5" />
              Download White Paper
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}