import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
} from "@heroui/react";
import { Form } from "@prisma/client";
import { formatDistance } from "date-fns";
import Link from "next/link";

export const FormCard = ({ form }: { form: Form }) => {
  return (
    <Card>
      <CardHeader className="flex-col items-start">
        <div className="flex items-center gap-2 justify-between w-full">
          <span className="truncate font-bold">{form.title}</span>
          {form.isPublished && <Chip size="sm">Published</Chip>}
          {!form.isPublished && (
            <Chip size="sm" variant="faded">
              Draft
            </Chip>
          )}
        </div>
        <div className="w-full flex flex-row items-center justify-between text-gray-700 text-sm flex-none">
          {formatDistance(form.createdAt, new Date(), {
            addSuffix: true,
          })}
          {form.isPublished && (
            <span className="flex items-center gap-2">
              <i
                className="icon-[lets-icons--view] text-gray-700"
                role="img"
                aria-hidden="true"
              />
              <span>{form.visits.toLocaleString()}</span>
              <i
                className="icon-[lets-icons--form] text-gray-700"
                role="img"
                aria-hidden="true"
              />
              <span>{form.submissionsCount.toLocaleString()}</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="h-[20px] truncate text-sm text-gray-700">
        {form.description || "No description"}
      </CardBody>
      <CardFooter className="justify-center">
        {form.isPublished && (
          <Button
            as={Link}
            href={`/app/your-forms/builder/${form.id}`}
            endContent={
              <i
                className="icon-[bx--right-arrow-alt]"
                role="img"
                aria-hidden="true"
              />
            }
          >
            View submissions
          </Button>
        )}
        {!form.isPublished && (
          <Button
            as={Link}
            href={`/app/your-forms/builder/${form.id}`}
            endContent={
              <i
                className="icon-[ant-design--form-outlined]"
                role="img"
                aria-hidden="true"
              />
            }
          >
            Edit form
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
