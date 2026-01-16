export interface Query {
    id: string;
    query: string;
    result: string;
    status: number;
}

export interface Agent {
    id: string;
    user_id: string;
    isOwner: boolean;
    title: string;
    description: string;
    token: string;
    isConnected?: boolean;
}