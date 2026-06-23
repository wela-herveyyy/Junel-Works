import { loadProfile, updateProfile } from "./store.js";
import { syncProfileFromErpnext } from "./sync.js";
import { normalizeProfileUpdates, } from "./types.js";
export class UserProfileManager {
    client;
    cached = null;
    constructor(client) {
        this.client = client;
    }
    async initialize() {
        this.cached = await loadProfile();
        if (this.client.isAuthenticated()) {
            try {
                this.cached = await syncProfileFromErpnext(this.client);
            }
            catch {
                // Profile sync is best-effort on startup.
            }
        }
        return this.cached;
    }
    async get(sync = false) {
        if (sync && this.client.isAuthenticated()) {
            this.cached = await syncProfileFromErpnext(this.client);
            return this.cached;
        }
        if (!this.cached) {
            this.cached = await loadProfile();
        }
        return this.cached;
    }
    async update(input) {
        const updates = normalizeProfileUpdates(input);
        const result = await updateProfile(updates);
        this.cached = result.profile;
        return result;
    }
}
