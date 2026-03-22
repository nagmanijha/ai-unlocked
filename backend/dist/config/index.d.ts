/** Application configuration loaded from environment variables */
export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly databaseUrl: string;
    readonly jwtSecret: string;
    readonly jwtExpiresIn: string;
    readonly redisUrl: string;
    readonly cosmos: {
        readonly endpoint: string;
        readonly key: string;
        readonly database: string;
        readonly container: string;
    };
    readonly acs: {
        readonly connectionString: string;
    };
    readonly search: {
        readonly endpoint: string;
        readonly key: string;
        readonly indexName: string;
    };
    readonly openai: {
        readonly endpoint: string;
        readonly key: string;
        readonly deployment: string;
    };
    readonly storage: {
        readonly connectionString: string;
        readonly containerName: string;
    };
    readonly speech: {
        readonly key: string;
        readonly region: string;
    };
    readonly corsOrigin: string;
};
//# sourceMappingURL=index.d.ts.map