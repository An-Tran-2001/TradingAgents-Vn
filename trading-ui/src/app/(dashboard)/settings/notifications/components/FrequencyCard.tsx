import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormContext } from "react-hook-form"

export function FrequencyCard() {
  const { control } = useFormContext()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Frequency</CardTitle>
        <CardDescription>
          Control how often you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="emailFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="hourly">Hourly digest</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Quiet Hours</FormLabel>
          <div className="flex space-x-2">
            <FormField
              control={control}
              name="quietHoursStart"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-50">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="22:00">10:00 PM</SelectItem>
                    <SelectItem value="23:00">11:00 PM</SelectItem>
                    <SelectItem value="00:00">12:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <span className="self-center">to</span>
            <FormField
              control={control}
              name="quietHoursEnd"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-50">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </FormItem>
      </CardContent>
    </Card>
  )
}
