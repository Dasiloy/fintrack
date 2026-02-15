import { formatCurrency } from '@fintrack/utils/format';
import { Button } from '@ui/components/atoms/button';
import type { ApiResponse } from '@fintrack/types/interfaces/api';

export default function Home() {
  (() => {
    const api: ApiResponse<any> = {
      data: 'Bode Thomas',
      success: true,
    };
    console.log(api);
  })();

  console.log(formatCurrency(500));

  return (
    <div className="p-6">
      <Button>Hekllo there, ui set</Button>
    </div>
  );
}
