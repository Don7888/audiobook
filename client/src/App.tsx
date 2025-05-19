import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Help from "@/pages/Help";
import Subscription from "@/pages/Subscription";
import AudioDownload from "@/pages/AudioDownload";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Characters from "@/pages/Characters";
import SoundEffects from "@/pages/SoundEffects";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/library" component={Library} />
      <Route path="/help" component={Help} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/audio-download" component={AudioDownload} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/characters" component={Characters} />
      <Route path="/sound-effects" component={SoundEffects} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
