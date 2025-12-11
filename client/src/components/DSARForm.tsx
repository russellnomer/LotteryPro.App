import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, CheckCircle } from "lucide-react";
import { validateEmail, sanitizeInput } from "@/lib/formValidation";

export default function DSARForm() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    requestType: "",
    details: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/dsar/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "We'll respond to your data request within 30 days.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.requestType) {
      newErrors.requestType = "Please select a request type";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    submitMutation.mutate({
      email: sanitizeInput(formData.email),
      name: sanitizeInput(formData.name),
      requestType: formData.requestType,
      details: sanitizeInput(formData.details)
    });
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Received</h3>
          <p className="text-sm text-gray-600">
            We've received your data subject access request. A verification email has been sent to {formData.email}. 
            We'll process your request within 30 days as required by CCPA/GDPR.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5" />
          Data Subject Access Request (DSAR)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Exercise your CCPA/GDPR data rights
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dsar-email">Email Address *</Label>
            <Input
              id="dsar-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? 'border-red-500' : ''}
              placeholder="your-email@example.com"
              data-testid="input-dsar-email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <Label htmlFor="dsar-name">Full Name *</Label>
            <Input
              id="dsar-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Your full name"
              data-testid="input-dsar-name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Label htmlFor="request-type">Request Type *</Label>
            <Select 
              value={formData.requestType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, requestType: value }))}
            >
              <SelectTrigger className={errors.requestType ? 'border-red-500' : ''} data-testid="select-dsar-type">
                <SelectValue placeholder="Select request type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Access My Data</SelectItem>
                <SelectItem value="delete">Delete My Data</SelectItem>
                <SelectItem value="portability">Export My Data</SelectItem>
                <SelectItem value="opt-out">Opt-Out of Data Sale</SelectItem>
                <SelectItem value="correction">Correct My Data</SelectItem>
              </SelectContent>
            </Select>
            {errors.requestType && <p className="text-xs text-red-500 mt-1">{errors.requestType}</p>}
          </div>
          
          <div>
            <Label htmlFor="dsar-details">Additional Details (Optional)</Label>
            <Textarea
              id="dsar-details"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Any additional information about your request..."
              rows={3}
              data-testid="input-dsar-details"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={submitMutation.isPending}
            data-testid="button-submit-dsar"
          >
            {submitMutation.isPending ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            We'll verify your identity via email and respond within 30 days.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
