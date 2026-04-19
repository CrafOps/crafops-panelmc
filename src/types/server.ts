export interface MinecraftServer {
    id: string;
    name: string;
    state: 'running' | 'exited' | 'created';
    status: string;
    image: string;
    ports: {
        public: number;
        private: number;
        type: string;
    }[];
}