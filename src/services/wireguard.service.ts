import axios from 'axios';
import { Server } from '@prisma/client';

export class WireGuardService {
  private async getSession(server: Server) {
    const res = await axios.post(`${server.apiUrl}/api/session`, { password: server.apiPassword });
    return res.headers['set-cookie'] || [];
  }

  async createPeer(server: Server, name: string) {
    const cookies = await this.getSession(server);
    
    await axios.post(
      `${server.apiUrl}/api/wireguard/client`,
      { name },
      { headers: { Cookie: cookies } }
    );

    const peersRes = await axios.get(
      `${server.apiUrl}/api/wireguard/client`,
      { headers: { Cookie: cookies } }
    );
    const peer = peersRes.data.find((p: { id: string, name: string, publicKey: string, address: string }) => p.name === name);
    
    if (!peer) throw new Error('Peer created but not found in client list');

    const configRes = await axios.get(
      `${server.apiUrl}/api/wireguard/client/${peer.id}/configuration`,
      { headers: { Cookie: cookies } }
    );

    return {
      configFile: configRes.data,
      assignedIp: peer.address || '0.0.0.0',
      publicKey: peer.publicKey || '',
    };
  }

  async enablePeer(server: Server, id: string) {
    const cookies = await this.getSession(server);
    await axios.post(`${server.apiUrl}/api/wireguard/client/${id}/enable`, {}, { headers: { Cookie: cookies } });
  }

  async disablePeer(server: Server, id: string) {
    const cookies = await this.getSession(server);
    await axios.post(`${server.apiUrl}/api/wireguard/client/${id}/disable`, {}, { headers: { Cookie: cookies } });
  }

  async deletePeer(server: Server, id: string) {
    const cookies = await this.getSession(server);
    await axios.delete(`${server.apiUrl}/api/wireguard/client/${id}`, { headers: { Cookie: cookies } });
  }
}

export const wireguardService = new WireGuardService();
