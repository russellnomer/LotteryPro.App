import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Send,
  Loader2,
  FileText,
  CreditCard,
  Bug,
  Lightbulb,
  Settings,
  LifeBuoy
} from "lucide-react";

const ticketSchema = z.object({
  userEmail: z.string().email("Please enter a valid email address"),
  userName: z.string().min(1, "Please enter your name"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(["billing", "technical", "account", "feature_request", "bug_report", "other"]),
  description: z.string().min(20, "Please provide more details (at least 20 characters)"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const categoryIcons: Record<string, any> = {
  billing: CreditCard,
  technical: Settings,
  account: LifeBuoy,
  feature_request: Lightbulb,
  bug_report: Bug,
  other: HelpCircle,
};

const categoryLabels: Record<string, string> = {
  billing: "Billing & Payments",
  technical: "Technical Issue",
  account: "Account Help",
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  other: "Other",
};

export default function Support() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      userEmail: "",
      userName: "",
      subject: "",
      category: "other",
      description: "",
    },
  });

  const submitTicket = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await apiRequest("POST", "/api/support/tickets", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setSubmitted(true);
      setTicketId(data.ticketId);
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit ticket",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    submitTicket.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-success-title">Ticket Submitted Successfully!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your support ticket has been received. We'll respond as soon as possible.
              </p>
              {ticketId && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your Ticket ID:</p>
                  <p className="font-mono font-bold text-lg" data-testid="text-ticket-id">{ticketId}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setTicketId(null);
                    form.reset();
                  }}
                  variant="outline"
                  data-testid="button-new-ticket"
                >
                  Submit Another Ticket
                </Button>
                <Link href="/">
                  <Button data-testid="button-return-home">Return to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/">
          <a className="inline-flex items-center text-primary hover:text-primary/80 mb-8" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </a>
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-page-title">Contact Support</CardTitle>
                    <CardDescription>We're here to help. Submit a ticket and we'll respond promptly.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="userName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="userEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(categoryLabels).map(([value, label]) => {
                                const Icon = categoryIcons[value];
                                return (
                                  <SelectItem key={value} value={value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      {label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief summary of your issue" {...field} data-testid="input-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or other relevant information."
                              rows={6}
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitTicket.isPending}
                      data-testid="button-submit-ticket"
                    >
                      {submitTicket.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Urgent Issues:</span>
                  <span className="font-medium">2-4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Normal Requests:</span>
                  <span className="font-medium">24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Feature Requests:</span>
                  <span className="font-medium">3-5 days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/privacy">
                  <a className="block text-sm text-primary hover:underline" data-testid="link-privacy">Privacy Policy</a>
                </Link>
                <Link href="/terms">
                  <a className="block text-sm text-primary hover:underline" data-testid="link-terms">Terms of Service</a>
                </Link>
                <Link href="/pricing">
                  <a className="block text-sm text-primary hover:underline" data-testid="link-subscription">Subscription Plans</a>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Need Immediate Help?</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      For billing emergencies or account lockouts, mark your ticket as "Urgent" 
                      in the description.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
