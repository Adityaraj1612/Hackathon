import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Shield, Heart, Flame, Truck } from "lucide-react";

interface EmergencyContactsModalProps {
  open: boolean;
  onClose: () => void;
}

const emergencyContacts = [
  {
    name: "Police",
    number: "100",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    name: "Fire Brigade",
    number: "101",
    icon: Flame,
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    name: "Ambulance",
    number: "108",
    icon: Heart,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    name: "Emergency",
    number: "112",
    icon: Phone,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    name: "Disaster Management",
    number: "1078",
    icon: Truck,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  }
];

export function EmergencyContactsModal({ open, onClose }: EmergencyContactsModalProps) {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            🚨 Emergency Contacts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {emergencyContacts.map((contact) => {
            const Icon = contact.icon;
            return (
              <Button
                key={contact.number}
                onClick={() => handleCall(contact.number)}
                variant="outline"
                className="w-full h-16 justify-start gap-4 hover:bg-muted/50"
              >
                <div className={`w-12 h-12 rounded-full ${contact.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${contact.color}`} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.number}</p>
                </div>
                <Phone className="w-4 h-4 ml-auto" />
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}