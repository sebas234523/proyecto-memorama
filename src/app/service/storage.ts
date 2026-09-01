import { Injectable } from '@angular/core';

export interface PartidaHistorial {
  fecha: string;
  attempts: number;
  win: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private bestKey = 'memorama_best';
  private historyKey = 'memorama_history';

  async init(): Promise<void> {
    return;
  }

  async getBestAttempts(): Promise<number> {

    const value = localStorage.getItem(this.bestKey);

    return value ? Number(value) : 0;
  }

  async saveBestAttemptsIfRecord(attempts: number): Promise<boolean> {

    const current = await this.getBestAttempts();

    const isRecord =
      current === 0 || attempts < current;

    if (isRecord) {

      localStorage.setItem(
        this.bestKey,
        String(attempts)
      );

    }

    return isRecord;
  }

  async saveHistory(
    entry: PartidaHistorial
  ): Promise<void> {

    const history =
      await this.getHistory();

    history.push(entry);

    localStorage.setItem(
      this.historyKey,
      JSON.stringify(history)
    );
  }

  async getHistory(): Promise<PartidaHistorial[]> {

    const history =
      localStorage.getItem(this.historyKey);

    return history
      ? JSON.parse(history)
      : [];
  }

  async clearHistory(): Promise<void> {

    localStorage.removeItem(
      this.historyKey
    );
  }

  async clearBestAttempts(): Promise<void> {

    localStorage.removeItem(
      this.bestKey
    );
  }

  async clearAll(): Promise<void> {

    await this.clearHistory();

    await this.clearBestAttempts();
  }
}