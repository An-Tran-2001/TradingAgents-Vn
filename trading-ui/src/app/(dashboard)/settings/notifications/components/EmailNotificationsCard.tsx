import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form"
import { useFormContext } from "react-hook-form"

export function EmailNotificationsCard() {
  const { control } = useFormContext()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose what email notifications you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={control}
            name="emailSecurity"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Security alerts</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Get notified when there are security events on your account.
                  </p>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="emailUpdates"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Product updates</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and improvements.
                  </p>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="emailMarketing"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Marketing emails</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about our latest offers and promotions.
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
