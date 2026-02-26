/**
 * Jellyfin library management utilities
 */

import * as jose from 'jose';

const REFRESH_DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes

let lastRefreshTime = 0;

/**
 * Trigger a delta scan ("Scan for new and updated files") on the Jellyfin music library.
 * Debounced to at most once every 10 minutes.
 *
 * @param jellyfinToken - The Jellyfin access token from the user's JWT claims
 * @returns Whether the refresh was triggered, and a reason if it was skipped
 */
export async function triggerMusicLibraryRefresh(
  jellyfinToken: string
): Promise<{ triggered: boolean; reason?: string }> {
  const now = Date.now();
  const elapsed = now - lastRefreshTime;

  if (lastRefreshTime > 0 && elapsed < REFRESH_DEBOUNCE_MS) {
    const remaining = Math.ceil((REFRESH_DEBOUNCE_MS - elapsed) / 1000 / 60);
    return {
      triggered: false,
      reason: `Library refresh debounced — next allowed in ~${remaining} minute(s)`
    };
  }

  const jellyfinHost = Deno.env.get('JELLYFIN_HOST') || 'http://localhost:8096';
  const headers = {
    'X-Emby-Token': jellyfinToken,
    'Content-Type': 'application/json'
  };

  // 1. Find the music library's ItemId
  let musicItemId: string | undefined;
  try {
    const foldersRes = await fetch(`${jellyfinHost}/Library/VirtualFolders`, { headers });
    if (!foldersRes.ok) {
      return { triggered: false, reason: `Failed to fetch virtual folders: HTTP ${foldersRes.status}` };
    }
    const folders: { ItemId: string; CollectionType: string; Name: string }[] = await foldersRes.json();
    musicItemId = folders.find(f => f.CollectionType === 'music')?.ItemId;
  } catch (error) {
    return { triggered: false, reason: `Error fetching virtual folders: ${(error as Error).message}` };
  }

  if (!musicItemId) {
    return { triggered: false, reason: 'No music library found in Jellyfin' };
  }

  // 2. Trigger delta refresh
  const params = new URLSearchParams({
    Recursive: 'true',
    MetadataRefreshMode: 'Default',
    ImageRefreshMode: 'Default',
    ReplaceAllMetadata: 'false',
    ReplaceAllImages: 'false'
  });

  try {
    const refreshRes = await fetch(
      `${jellyfinHost}/Items/${musicItemId}/Refresh?${params}`,
      { method: 'POST', headers }
    );
    if (!refreshRes.ok) {
      return { triggered: false, reason: `Jellyfin refresh request failed: HTTP ${refreshRes.status}` };
    }
  } catch (error) {
    return { triggered: false, reason: `Error triggering refresh: ${(error as Error).message}` };
  }

  lastRefreshTime = now;
  console.log(`[Jellyfin] Music library delta refresh triggered (ItemId: ${musicItemId})`);
  return { triggered: true };
}

/**
 * Decode the Jellyfin access token from a PlDyn JWT string.
 */
export function extractJellyfinToken(pldynJwt: string): string | undefined {
  try {
    const claims = jose.decodeJwt(pldynJwt);
    return claims.AccessToken as string | undefined;
  } catch {
    return undefined;
  }
}
