import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Bell, Mail, MessageSquare } from "lucide-react"
import { useFormContext } from "react-hook-form"

export function ChannelsCard() {
  const { control } = useFormContext()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Channels</CardTitle>
        <CardDescription>
          Choose your preferred notification channels for different types of alerts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FormField
            control={control}
            name="channelEmail"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <FormLabel className="font-medium mb-1">Email</FormLabel>
                    <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                  </div>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Separator />
          <FormField
            control={control}
            name="channelPush"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <FormLabel className="font-medium mb-1">Push Notifications</FormLabel>
                    <div className="text-sm text-muted-foreground">Receive browser push notifications</div>
                  </div>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Separator />
          <FormField
            control={control}
            name="channelSms"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <FormLabel className="font-medium mb-1">SMS</FormLabel>
                    <div className="text-sm text-muted-foreground">Receive notifications via SMS</div>
                  </div>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
