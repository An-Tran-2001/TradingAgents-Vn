import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form"
import { useFormContext } from "react-hook-form"

export function PushNotificationsCard() {
  const { control } = useFormContext()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Configure browser and mobile push notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={control}
            name="pushMessages"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>New messages</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you receive new messages.
                  </p>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="pushMentions"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Mentions</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you.
                  </p>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="pushTasks"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Task updates</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Get notified about task assignments and updates.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
