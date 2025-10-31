"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";

interface MemberProps {
  memberBalance: bigint | undefined;
}

export const Member = ({ memberBalance }: MemberProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const isRegularMember = memberBalance === 1n;

  const handleMemberClick = () => {
    if (!isRegularMember) return;
    // Generate QR code data
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const qrData = `MEMBER-REGULAR-${timestamp}-${randomString}`;
    setQrCodeData(qrData);
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQrCodeData(null);
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-8">會員中心</h1>
      <div className="space-y-4 w-full max-w-xs">
        <Button
          onClick={handleMemberClick}
          variant={isRegularMember ? "default" : "outline"}
          className={`w-full justify-center relative ${
            isRegularMember ? "bg-yellow-400 hover:bg-yellow-500 text-black" : ""
          }`}
        >
          一般會員
          {isRegularMember && <span className="absolute right-4 text-xs font-normal">現屬資格</span>}
        </Button>
        <Button variant="outline" disabled className="w-full disabled:opacity-30">
          VIP會員
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xs bg-white border-0">
          <DialogHeader>
            <DialogTitle className="text-center">會員資格</DialogTitle>
          </DialogHeader>
          {qrCodeData && (
            <div className="flex flex-col items-center justify-center p-6">
              <QRCodeSVG value={qrCodeData} size={200} level="H" includeMargin={true} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
