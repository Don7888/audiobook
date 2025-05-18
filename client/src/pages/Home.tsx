import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import StoryCreator from "@/components/StoryCreator";
import ExampleStories from "@/components/ExampleStories";
import DownloadPlatforms from "@/components/DownloadPlatforms";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>StoryTunes - Create Magical Audiobooks for Kids</title>
        <meta name="description" content="Create personalized children's audiobooks using AI. Export to Yoto, Toni, and Audible. Turn your ideas into captivating stories with text-to-speech narration." />
      </Helmet>
      <div>
        <Hero />
        <HowItWorks />
        <StoryCreator />
        <ExampleStories />
        <DownloadPlatforms />
        <Testimonials />
        <CallToAction />
      </div>
    </>
  );
}
