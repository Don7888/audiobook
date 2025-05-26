import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Legal() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Legal Requirements
        </h1>
        <p className="text-gray-600">
          Important legal guidelines for using our AI story generation service
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              Copyright and Intellectual Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              By using our story generation service, you agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You will not request stories based on copyrighted characters, franchises, or existing works</li>
              <li>You understand that generated content should be original and not infringe on existing intellectual property</li>
              <li>You will not use the service to create content that copies or mimics existing copyrighted stories, characters, or brands</li>
              <li>You are responsible for ensuring your prompts do not violate any copyright or trademark laws</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-blue-600">📝</span>
              Content Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              All generated content must be:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Appropriate for children and family-friendly</li>
              <li>Free from violence, inappropriate language, or adult themes</li>
              <li>Original and not derivative of existing copyrighted works</li>
              <li>Respectful and inclusive of all backgrounds and cultures</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              User Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              As a user, you are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Reviewing generated content before use or distribution</li>
              <li>Ensuring your use of generated content complies with applicable laws</li>
              <li>Not using the service for commercial purposes without proper licensing</li>
              <li>Respecting the intellectual property rights of others</li>
              <li>Confirming you have read and agree to these requirements before generating stories</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-orange-600">🛡️</span>
              Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              While our AI system is designed to generate original content and avoid copyright infringement, 
              users are ultimately responsible for ensuring their use of generated content is legal and appropriate. 
              We recommend reviewing all generated content and consulting with legal counsel if you have questions 
              about intellectual property rights.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}