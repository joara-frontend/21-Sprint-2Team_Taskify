import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CardCreateType,
  CardDetailType,
  CardUpdateType,
  SyncCardListType,
  TagItem,
} from "@/types/card.type";
import { useParams } from "next/navigation";
import { DatePicker } from "react-datepicker";
import { formatToApiDate } from "@/utils/formatDate";
import { getTagColor } from "@/utils/getTagColor";
import { postCardImage, postCards, putCards } from "@/api/cards.api";
import { CardFormSchema, CardFormValues } from "@/types/card.schema";
import { getMembers } from "@/api/members.api";
import { MemberType } from "@/types/user.type";
import { getColumns } from "@/api/columns.api";
import { Column } from "@/types/column.type";
import { handleApiError } from "@/utils/handleError";
import { showToast } from "@/contexts/ToastProvider";

export function useCardForm(
  onClose: () => void,
  onSuccess: SyncCardListType,
  columnId: number,
  initialData?: CardDetailType | null,
) {
  const params = useParams();
  const dashboardId = Number(params?.id) ?? null;

  const {
    control,
    formState: { errors, isValid, isDirty },
    setValue,
    handleSubmit: handleSubmit,
  } = useForm<CardFormValues>({
    resolver: zodResolver(CardFormSchema),
    mode: "onTouched",
    defaultValues: {
      dashboardId: dashboardId,
      columnId: initialData?.columnId || columnId,
      assigneeUserId: initialData?.assignee.id,
      cardId: initialData?.id || null,
      title: initialData?.title || "",
      description: initialData?.description || "",
      dueDate: initialData?.dueDate || "",
      tags: initialData?.tags || [],
      imageUrl: initialData?.imageUrl || "",
    },
  });

  const [columnList, setColumnList] = useState<Column[]>([]);
  const [memberList, setMemberList] = useState<MemberType[]>([]);
  const datepickerRef = useRef<DatePicker>(null);
  const [tagList, setTagList] = useState<TagItem[]>(() => {
    return initialData?.tags ? initialData.tags.map(getTagColor) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    return initialData?.imageUrl || null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 컬럼 목록 가져오기
  const getColumnList = useCallback(async () => {
    try {
      const res = await getColumns(dashboardId);
      if (res?.data?.result === "SUCCESS") {
        const nextColumnList: Column[] = res.data.data;
        setColumnList(nextColumnList);
      } else {
        const serverMessage = res?.data?.message;
        showToast.error(serverMessage || "데이터를 가져오는 데 실패했습니다.");
      }
    } catch (error) {
      handleApiError(error, "컬럼 목록 조회 실패");
    }
  }, [dashboardId]);

  // 담당자 목록 가져오기 및 변경
  const getMemberList = useCallback(async () => {
    try {
      const res = await getMembers(dashboardId);
      if (!res || !res.data) return;
      const nextMemberList: MemberType[] = res.data.members;
      setMemberList(nextMemberList);

      if (!initialData && nextMemberList.length > 0) {
        setValue("assigneeUserId", nextMemberList[0].userId, {
          shouldValidate: true,
        });
      }
    } catch (error) {
      handleApiError(error, "담당자 목록 조회 실패:");
    }
  }, [dashboardId, initialData, setValue]);

  // 마감일 날짜 선택 및 변경
  const handleDateChange = (
    date: Date | null,
    onChange: (value: string) => void,
  ) => {
    onChange(date ? formatToApiDate(date) : "");

    if (date && datepickerRef.current) {
      datepickerRef.current.setOpen(false);
    }
  };

  // 태그 추가 및 변경
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentTags: string[],
    onChange: (value: string[]) => void,
  ) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();

      if (value) {
        setTagList((prev) => [...prev, getTagColor(value)]);
        onChange([...(currentTags || []), value]);
        e.currentTarget.value = "";
      }
    }

    if (e.key === "Backspace") {
      if (e.currentTarget.value === "") {
        const newList = [...tagList];
        newList.pop();
        setTagList(newList);
        onChange(newList.map((tag) => tag.name));
      }
    }
  };

  // 이미지 추가 및 변경
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (value: File) => void,
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    onChange(selectedFile);
    const blobUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(blobUrl);
  };

  const uploadImage = async (imageUrl: File) => {
    const res = await postCardImage(imageUrl, columnId);
    const nextImageUrl: string = res.imageUrl;
    return nextImageUrl;
  };

  const onCreate = async (data: CardFormValues) => {
    const result = await postCards(data as unknown as CardCreateType);
    return result;
  };

  const onUpdate = async (data: CardFormValues) => {
    if (!data.cardId) return;

    const result = await putCards(
      data.cardId,
      data as unknown as CardUpdateType,
    );
    return result;
  };

  const onSubmit = async (data: CardFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      let finalData = data;
      if (typeof data.imageUrl !== "string") {
        const returnImageUrl = await uploadImage(data.imageUrl);
        finalData = {
          ...data,
          imageUrl: returnImageUrl,
        };
      }

      let result;
      const isEdit = data.cardId;
      if (!isEdit) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cardId: _cardId, ...payload } = finalData;
        result = await onCreate(payload);
      } else if (data.cardId && isDirty) {
        result = await onUpdate(finalData);
      }

      if (result) {
        const type = isEdit ? "edit" : "create";
        const message = isEdit ? "수정되었습니다!" : "생성되었습니다!";
        showToast.success(message);
        onSuccess(type, result, data.cardId ?? undefined);
      }
      onClose();
    } catch (error) {
      handleApiError(error, "할 일 저장 실패:");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const tasks: Promise<void>[] = [];
      if (dashboardId) tasks.push(getMemberList());
      if (initialData?.id) tasks.push(getColumnList());
      await Promise.allSettled(tasks);
    };
    fetchData();
  }, [initialData?.id, dashboardId, getMemberList, getColumnList]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    formProps: {
      control,
      errors,
      isValid,
      isDirty,
      isSubmitting,
      onFormSubmit: handleSubmit,
      onSubmit,
    },
    selectOptions: {
      columnList,
      memberList,
    },
    datepickerProps: {
      datepickerRef,
      onDateChange: handleDateChange,
    },
    tagProps: {
      tagList,
      onKeyDown: handleKeyDown,
    },
    imageProps: {
      previewUrl,
      fileInputRef,
      onImageButtonClick: handleImageButtonClick,
      onFileChange: handleFileChange,
    },
  };
}
