import type { Repository, Settings, Release, Category, SyncState, Dimension, View, FocusPoint, VectorRecord, VectorIndexMeta } from '../types';

export const storageService = {
    // ==================== Settings ====================
    getSettings(): Partial<Settings> {
        return window.githubStarsAPI.getSettings();
    },

    setSettings(settings: Partial<Settings>): void {
        window.githubStarsAPI.setSettings(settings as Settings);
    },

    // ==================== Token ====================
    getToken(): string | null {
        return window.githubStarsAPI.getToken();
    },

    setToken(token: string): void {
        window.githubStarsAPI.setToken(token);
    },

    // ==================== Sync State ====================
    getSyncState(): SyncState | null {
        return window.githubStarsAPI.getSyncState();
    },

    setSyncState(state: SyncState): void {
        window.githubStarsAPI.setSyncState(state);
    },

    // ==================== Repositories (分片存储) ====================
    getRepositories(): Repository[] {
        return window.githubStarsAPI.getRepos() || [];
    },

    setRepositories(repos: Repository[]): void {
        window.githubStarsAPI.setRepos(repos);
    },

    // ==================== Releases ====================
    getReleases(): Release[] {
        return window.githubStarsAPI.getStoredReleases();
    },

    setReleases(releases: Release[]): void {
        window.githubStarsAPI.setStoredReleases(releases);
    },

    getReadReleaseIds(): Set<number> {
        return new Set(window.githubStarsAPI.getReadReleaseIds());
    },

    setReadReleaseIds(ids: Set<number>): void {
        window.githubStarsAPI.setReadReleaseIds(Array.from(ids));
    },

    getReleaseSubscriptions(): Set<number> {
        return new Set(window.githubStarsAPI.getReleaseSubscriptions());
    },

    setReleaseSubscriptions(ids: Set<number>): void {
        window.githubStarsAPI.setReleaseSubscriptions(Array.from(ids));
    },

    // ==================== Categories ====================
    getCategories(): Category[] {
        return window.githubStarsAPI.getCategories();
    },

    setCategories(categories: Category[]): void {
        window.githubStarsAPI.setCategories(categories);
    },

    // ==================== 维度标签 🆕 ====================
    getDimensions(): Dimension[] {
        return window.githubStarsAPI.getDimensions();
    },

    setDimensions(dimensions: Dimension[]): void {
        window.githubStarsAPI.setDimensions(dimensions);
    },

    // ==================== 视图管理 🆕 ====================
    getViews(): View[] {
        return window.githubStarsAPI.getViews();
    },

    setViews(views: View[]): void {
        window.githubStarsAPI.setViews(views);
    },

    // ==================== 关注重点 🆕 ====================
    getFocusPoints(): FocusPoint[] {
        return window.githubStarsAPI.getFocusPoints();
    },

    setFocusPoints(focusPoints: FocusPoint[]): void {
        window.githubStarsAPI.setFocusPoints(focusPoints);
    },

    // ==================== 向量索引 🆕 ====================
    getVectorMeta(): VectorIndexMeta | null {
        return window.githubStarsAPI.getVectorMeta();
    },

    saveVectors(vectors: VectorRecord[]): void {
        window.githubStarsAPI.saveVectors(vectors);
    },

    loadVectors(): VectorRecord[] {
        return window.githubStarsAPI.loadVectors();
    },

    removeVectors(): void {
        window.githubStarsAPI.removeVectors();
    },
};
