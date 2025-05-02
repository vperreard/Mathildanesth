import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import RoomsList from '@/modules/planning/bloc-operatoire/components/RoomsList';
import SectorsList from '@/modules/planning/bloc-operatoire/components/SectorsList';
import SupervisionRulesList from '@/modules/planning/bloc-operatoire/components/SupervisionRulesList';

export default function OperatingRoomsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion du bloc opératoire</h1>
            </div>

            <Tabs defaultValue="rooms" className="space-y-6">
                <TabsList className="mb-4">
                    <TabsTrigger value="rooms">Salles</TabsTrigger>
                    <TabsTrigger value="sectors">Secteurs</TabsTrigger>
                    <TabsTrigger value="rules">Règles de supervision</TabsTrigger>
                </TabsList>

                <TabsContent value="rooms" className="space-y-6">
                    <RoomsList />
                </TabsContent>

                <TabsContent value="sectors" className="space-y-6">
                    <SectorsList />
                </TabsContent>

                <TabsContent value="rules" className="space-y-6">
                    <SupervisionRulesList />
                </TabsContent>
            </Tabs>
        </div>
    );
} 