import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Helmet } from "react-helmet";

const faqs = [
  {
    question: "How do I create my first story?",
    answer: "To create your first story, navigate to the Create page and enter a story prompt describing the kind of story you want. Select age range, story length, type, and narrator voice, then click 'Generate Story'. Our AI will create a unique story for you."
  },
  {
    question: "What devices are compatible with StoryTunes?",
    answer: "StoryTunes creates audio files that are compatible with Yoto players, Tonieboxes, and can be exported in formats that work with Audible and most audio players. We support MP3, M4A, and WAV formats."
  },
  {
    question: "Can I edit the stories after they're generated?",
    answer: "Yes! After generating a story, you can edit both the text and title by going to the 'Edit Story' tab. Save your changes, and the audio will be regenerated to match your edits."
  },
  {
    question: "How many stories can I create for free?",
    answer: "Our free plan allows you to create up to 3 complete stories with audio. For unlimited story creation and additional features, check out our premium plans."
  },
  {
    question: "Is my child's data safe?",
    answer: "Yes, we prioritize your privacy and your child's safety. We don't collect any personal data from children, and all stories are stored securely. We comply with COPPA and other children's privacy regulations."
  },
  {
    question: "How do I transfer stories to my Yoto player?",
    answer: "After creating a story, go to your library and select the story. Choose the 'Export to Yoto' option, and follow the instructions to create a Yoto card. You'll need a blank Yoto card and the Yoto app."
  }
];

export default function Help() {
  return (
    <>
      <Helmet>
        <title>Help Center - StoryTunes</title>
        <meta name="description" content="Get answers to common questions about creating, saving, and exporting children's audiobooks with StoryTunes. Find tutorials and support." />
      </Helmet>
      <div className="bg-light min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-center mb-8">Help Center</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Getting Started</h3>
                <p className="text-gray-600 mb-4">Learn the basics of creating your first story and navigating the platform.</p>
                <Button className="bg-primary text-white w-full">
                  View Guide
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tablet-smartphone"><rect width="10" height="14" x="3" y="8" rx="2"/><rect width="16" height="20" x="5" y="2" rx="2" transform="rotate(90 5 2)"/><path d="M17 17v-1"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Device Tutorials</h3>
                <p className="text-gray-600 mb-4">Step-by-step guides for using your stories with Yoto, Toni, and Audible.</p>
                <Button className="bg-secondary text-white w-full">
                  View Tutorials
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-dark text-2xl mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-question"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Support</h3>
                <p className="text-gray-600 mb-4">Need more help? Contact our support team for personalized assistance.</p>
                <Button className="bg-accent text-dark w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-2xl mb-6 text-center">Frequently Asked Questions</h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-xl shadow-sm border-none">
                  <AccordionTrigger className="px-6 py-4 font-heading font-semibold text-left hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Still have questions? We're here to help!</p>
              <Link href="/">
                <Button className="bg-primary text-white font-heading">
                  Go Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
