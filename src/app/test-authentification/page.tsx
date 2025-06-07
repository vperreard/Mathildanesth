'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import apiClient from '@/utils/apiClient';

export default function TestAuthPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const [apiTests, setApiTests] = useState<any[]>([]);
    
    useEffect(() => {
        if (user) {
            testAPIs();
        }
    }, [user]);
    
    const testAPIs = async () => {
        const tests = [];
        
        // Test /api/auth/me
        try {
            const meResponse = await apiClient.get('/api/auth/me');
            tests.push({ 
                endpoint: '/api/auth/me', 
                status: 'success', 
                data: meResponse.data 
            });
        } catch (error: unknown) {
            tests.push({ 
                endpoint: '/api/auth/me', 
                status: 'error', 
                error: error.response?.data || error.message 
            });
        }
        
        // Test /api/sites
        try {
            const sitesResponse = await apiClient.get('/api/sites');
            tests.push({ 
                endpoint: '/api/sites', 
                status: 'success', 
                count: sitesResponse.data.length 
            });
        } catch (error: unknown) {
            tests.push({ 
                endpoint: '/api/sites', 
                status: 'error', 
                error: error.response?.data || error.message 
            });
        }
        
        // Test /api/leaves with userId
        if (user?.id) {
            try {
                const leavesResponse = await apiClient.get(`/api/leaves?userId=${user.id}`);
                tests.push({ 
                    endpoint: `/api/leaves?userId=${user.id}`, 
                    status: 'success', 
                    count: leavesResponse.data.length 
                });
            } catch (error: unknown) {
                tests.push({ 
                    endpoint: `/api/leaves?userId=${user.id}`, 
                    status: 'error', 
                    error: error.response?.data || error.message 
                });
            }
        }
        
        // Test /api/utilisateurs
        try {
            const usersResponse = await apiClient.get('/api/utilisateurs');
            tests.push({ 
                endpoint: '/api/utilisateurs', 
                status: 'success', 
                count: Array.isArray(usersResponse.data) ? usersResponse.data.length : 
                       (usersResponse.data.users ? usersResponse.data.users.length : 0)
            });
        } catch (error: unknown) {
            tests.push({ 
                endpoint: '/api/utilisateurs', 
                status: 'error', 
                error: error.response?.data || error.message 
            });
        }
        
        setApiTests(tests);
    };
    
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };
    
    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }
    
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Auth State</h2>
                    <div className="space-y-2">
                        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
                        <p><strong>User Name:</strong> {user?.prenom} {user?.nom}</p>
                        <p><strong>User Role:</strong> {user?.role || 'None'}</p>
                        <p><strong>Auth Cookie:</strong> {getCookie('auth_token') ? 'Present' : 'Missing'}</p>
                        <p><strong>LocalStorage Token:</strong> {localStorage.getItem('auth_token') ? 'Present' : 'Missing'}</p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">API Tests</h2>
                    {apiTests.length === 0 ? (
                        <p>No tests run yet. {!user && 'Please log in first.'}</p>
                    ) : (
                        <div className="space-y-3">
                            {apiTests.map((test, index) => (
                                <div key={index} className={`p-3 rounded ${
                                    test.status === 'success' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    <p className="font-medium">{test.endpoint}</p>
                                    {test.status === 'success' ? (
                                        <p>Success - {test.count !== undefined ? `${test.count} items` : 'OK'}</p>
                                    ) : (
                                        <p>Error: {JSON.stringify(test.error)}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <button 
                        onClick={testAPIs}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Re-run Tests
                    </button>
                </div>
            </div>
        </div>
    );
}