import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MessageSquare } from 'lucide-react';

export const MessagesScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900 mb-6">
          Messages
        </h1>

        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
              Vendor Messaging
            </h3>
            <p className="font-sans text-neutral-600 mb-6">
              All your customer conversations are available in the main chat section.
            </p>
            <Button onClick={() => navigate('/chat')}>
              Go to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
