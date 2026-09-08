import { Injectable } from '@angular/core';

export interface PartidaHistorial {
  fecha: string;
  attempts: number;
  win: boolean;
  nombre?: string; // 🔥 AÑADIDO
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private bestKey = 'memorama_best';
  private historyKey = 'memorama_history';
  private nombreKey = 'memorama_nombre'; // 🔥 NUEVO

  async init(): Promise<void> {
    return;
  }

  // 🔥 NUEVO: Guardar nombre
  async saveNombreUsuario(nombre: string): Promise<void> {
    localStorage.setItem(this.nombreKey, nombre);
  }

  // 🔥 NUEVO: Obtener nombre
  async getNombreUsuario(): Promise<string> {
    return localStorage.getItem(this.nombreKey) || '';
  }

  async getBestAttempts(): Promise<number> {
    const value = localStorage.getItem(this.bestKey);
    return value ? Number(value) : 0;
  }

  async saveBestAttemptsIfRecord(attempts: number): Promise<boolean> {
    const current = await this.getBestAttempts();
    const isRecord = current === 0 || attempts < current;

    if (isRecord) {
      localStorage.setItem(this.bestKey, String(attempts));
    }

    return isRecord;
  }

  async saveHistory(entry: PartidaHistorial): Promise<void> {
    const history = await this.getHistory();
    
    // 🔥 Si no tiene nombre, asignar el actual
    if (!entry.nombre) {
      const nombre = await this.getNombreUsuario();
      entry.nombre = nombre || 'Anónimo';
    }
    
    history.push(entry);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  async getHistory(): Promise<PartidaHistorial[]> {
    const history = localStorage.getItem(this.historyKey);
    return history ? JSON.parse(history) : [];
  }

  async clearHistory(): Promise<void> {
    localStorage.removeItem(this.historyKey);
  }

  async clearBestAttempts(): Promise<void> {
    localStorage.removeItem(this.bestKey);
  }

  async clearAll(): Promise<void> {
    await this.clearHistory();
    await this.clearBestAttempts();
    localStorage.removeItem(this.nombreKey); // 🔥 AÑADIDO
  }
}