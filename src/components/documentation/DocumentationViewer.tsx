"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface DocumentationViewerProps {
    technicalDoc: string;
    userGuide: string;
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
    technicalDoc,
    userGuide,
}) => {
    const [activeTab, setActiveTab] = useState('user-guide');

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="user-guide">Guide Utilisateur</TabsTrigger>
                        <TabsTrigger value="technical">Documentation Technique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="user-guide">
                        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                            <ReactMarkdown>{userGuide}</ReactMarkdown>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="technical">
                        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                            <ReactMarkdown>{technicalDoc}</ReactMarkdown>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}; 