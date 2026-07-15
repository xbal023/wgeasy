import QRCode from 'qrcode';

export const generateQrCode = async (data: string): Promise<Buffer> => {
  try {
    return await QRCode.toBuffer(data, {
      type: 'png',
      margin: 1,
      width: 400,
    });
  } catch (err) {
    throw new Error('Failed to generate QR Code');
  }
};
